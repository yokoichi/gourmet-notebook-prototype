import { BUILTIN_LABELS, FIELD_LIMITS, parseManualTags } from './model.js';

const manualSnapshots=new WeakMap();
const formatTags=tags=>tags.map(tag=>/[",;、\r\n]/.test(tag)?'"'+tag.replaceAll('"','""')+'"':tag).join(', ');
function manualValues(form,settings) {
  return Object.fromEntries(settings.filter(f=>f.visible).map(field=>[field.id,field.id==='urls'?[...form.querySelectorAll('.url-input')].map(input=>input.value):form.elements.namedItem(field.id).value]));
}

const node=(tag,className='',text='')=>{const el=document.createElement(tag);el.className=className;el.textContent=text;return el;};
const button=(text,className,action)=>{const el=node('button',className,text);el.type='button';el.addEventListener('click',action);return el;};
function renderUrls(container,field,urls) {
  const legend=node('legend','field-label',field.label+(field.required?'（必須）':''));
  const rows=node('div','url-rows');
  let items=urls.length?urls.map(value=>({value,original:value})):[{value:'',original:null}];
  const count=node('p','field-help');
  const add=button('＋ URLを追加','outline-button',()=>{items.push({value:'',original:null});draw(items.length-1);});add.id='add-url';
  function draw(focusIndex=null) {
    rows.replaceChildren();
    items.forEach((item,index)=>{
      const row=node('div','url-row'),label=node('label','url-label',`${field.label} ${index+1}`),input=node('input','url-input');
      input.id=`url-input-${index}`;input.name='urls';input.type='url';input.maxLength=2000;input.value=item.value;input.placeholder='https://';input.setAttribute('aria-describedby','manual-error');label.htmlFor=input.id;
      const remove=button('削除','outline-button remove-url',()=>{items.splice(index,1);if(!items.length)items.push({value:'',original:null});draw(Math.min(index,items.length-1));});remove.setAttribute('aria-label',`${field.label} ${index+1}を削除`);
      row.append(label,input,remove);
      if(item.original) {
        const open=node('a','url-open','開く');open.href=item.original;open.target='_blank';open.rel='noopener noreferrer';open.setAttribute('aria-label',`${field.label} ${index+1}を開く`);
        const valid=()=>input.value.trim()===item.original;
        const update=()=>{open.hidden=!valid();if(valid())open.href=item.original;else open.removeAttribute('href');};
        input.addEventListener('input',update);open.addEventListener('click',event=>{if(!valid())event.preventDefault();});update();row.append(open);
      }
      input.addEventListener('input',()=>{item.value=input.value;});rows.append(row);
    });
    add.disabled=items.length>=10;count.textContent=`${items.length} / 10行。空行は保存しません。開くとリンク先へ通信します。`;
    if(focusIndex!==null)rows.querySelectorAll('input')[focusIndex]?.focus();
  }
  container.append(legend,rows,add,count);draw();
}
export function renderManualFields(container,settings,value) {
  container.replaceChildren();
  for(const field of settings.filter(f=>f.visible)) {
    const group=node(field.id==='urls'?'fieldset':'div','manual-field');group.dataset.fieldId=field.id;
    if(field.id==='urls')renderUrls(group,field,value?.urls||[]);
    else {
      const label=node('label','field-label',field.label+(field.required?'（必須）':'（任意）'));
      const multi=field.id==='memo'||field.id==='tags'||field.kind==='text';const input=node(multi?'textarea':'input');
      input.name=field.id;input.id=`manual-${field.id}`;input.required=field.required;input.maxLength=field.kind==='text'?1000:field.id==='tags'?766:FIELD_LIMITS[field.id];
      input.setAttribute('aria-describedby','manual-error');if(multi)input.rows=3;else input.type=field.id==='phone'?'tel':'text';
      input.value=field.kind==='text'?(value?.customValues[field.id]||''):field.id==='tags'?formatTags(value?.tags||[]):(value?.[field.id]||'');
      if(field.id==='tags')input.placeholder='カンマで区切る（例：ランチ, ひとり時間）';
      label.htmlFor=input.id;group.append(label,input);
      if(field.id==='tags')group.append(node('small','field-help','区切りや改行を含むタグは引用符で囲みます（例："朝,昼", 夜）。タグ内の引用符は2つ重ねます。'));
      if(field.kind==='text')group.append(node('small','field-help',`カスタム項目 · ${field.id.slice(-6)}`));
      else if(field.label!==BUILTIN_LABELS[field.id])group.append(node('small','field-help',`元の項目：${BUILTIN_LABELS[field.id]}`));
    }
    container.append(group);
  }
  const form=container.closest('form');
  manualSnapshots.set(form,{initial:value?manualValues(form,settings):null,tags:value?.tags||[]});
}
export function readManualValues(form,settings) {
  const current=manualValues(form,settings),snapshot=manualSnapshots.get(form),values={};
  for(const [id,value] of Object.entries(current))if(!snapshot?.initial||JSON.stringify(value)!==JSON.stringify(snapshot.initial[id]))values[id]=value;
  if(Object.hasOwn(values,'tags')) {
    const remaining=[...(snapshot?.tags||[])];
    values.tags=parseManualTags(values.tags).map(tag=>{
      const index=remaining.findIndex(original=>original.replace(/\r\n?/g,'\n')===tag);
      return index<0?tag:remaining.splice(index,1)[0];
    });
  }
  return values;
}
export function renderSettingsFields(container,draft,onChange) {
  container.replaceChildren();
  draft.forEach((field,index)=>{
    const row=node('div','setting-row');row.dataset.fieldId=field.id;
    const original=field.kind==='builtin'?BUILTIN_LABELS[field.id]:`カスタム項目 · ${field.id.slice(-6)}`;
    const label=node('label','setting-label',`${original}の表示名`),input=node('input');input.type='text';input.maxLength=40;input.value=field.label;input.dataset.setting='label';input.id=`setting-${field.id}`;label.htmlFor=input.id;
    input.addEventListener('input',()=>{field.label=input.value;onChange(draft,{redraw:false});});row.append(label,input);
    const controls=node('div','setting-controls');
    const boxes={};
    for(const [key,text]of[['visible','表示する'],['required','必須にする']]) {
      const wrap=node('label','check-label'),box=node('input');box.type='checkbox';box.checked=field[key];box.dataset.setting=key;box.disabled=field.id==='name'||(key==='required'&&!field.visible);box.setAttribute('aria-label',`${original}を${text}`);
      boxes[key]=box;
      box.addEventListener('change',()=>{field[key]=box.checked;if(key==='visible'){if(!field.visible)field.required=false;boxes.required.checked=field.required;boxes.required.disabled=!field.visible;}onChange(draft,{redraw:false});});
      wrap.append(box,node('span','',text));controls.append(wrap);
    }
    const moves=node('div','setting-moves');
    for(const [direction,delta,text]of[['up',-1,'上へ'],['down',1,'下へ']]) {
      const move=button(text,'outline-button',()=>{const next=[...draft];[next[index],next[index+delta]]=[next[index+delta],next[index]];onChange(next,{redraw:true,focusId:field.id,direction});});
      move.dataset.move=direction;move.disabled=index+delta<0||index+delta>=draft.length;move.setAttribute('aria-label',`${original}を${text}`);moves.append(move);
    }
    controls.append(moves);row.append(controls);container.append(row);
  });
}
