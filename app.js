import { decodeImportFile, parseImport, prepareImport, ticketsFor, MAX_BYTES } from './importer.js';
import { defaultFieldSettings, resetFieldSettings, serializeState, applyManualDraft, applyFieldSettings, MAX_JSON_BYTES, MAX_CUSTOM_FIELDS } from './model.js';
import { renderManualFields, readManualValues, renderSettingsFields } from './forms.js';
import { samples } from './samples.js';

const $ = selector => document.querySelector(selector);
const element = (tag, className = '', text = '') => {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
};
let state = {fieldSettings:defaultFieldSettings(),stores:samples.map(({mapsURL,...store})=>({...store,tags:[...store.tags],urls:mapsURL?[mapsURL]:[],customValues:{}}))};
let serialized = serializeState(state), stateRevision = 0;
let filter = '', dirty = false, preview = null, parsed = null, fileGeneration = 0, previewRevision = -1;
let manualId = null, settingsDraft = null, submitting = false;
const dialogOrigins = new Map();

function render() {
  const stores = state.stores;
  const query = $('#search').value.trim().toLowerCase();
  const genres = [...new Set(stores.map(store => store.genre).filter(Boolean))];
  if (filter && !genres.includes(filter)) filter = '';
  const filters = $('#filters');
  filters.replaceChildren();
  ['', ...genres].forEach(genre => {
    const button = element('button', 'filter', genre || 'すべて');
    button.type = 'button'; button.setAttribute('aria-pressed', String(genre === filter));
    button.addEventListener('click', () => { filter = genre; render(); });
    filters.append(button);
  });
  let visible = stores.filter(store => (!filter || store.genre === filter) && [store.name, store.address, store.memo, store.genre, ...store.tags].join(' ').toLowerCase().includes(query));
  if ($('#sort').value === 'name') visible = [...visible].sort((a, b) => a.name.localeCompare(b.name, 'ja'));
  $('#total-count').textContent = stores.length;
  $('#result-count').textContent = `${visible.length}件のお店${query || filter ? ' / ' + stores.length + '件中' : ''}`;
  const grid = $('#restaurant-grid'), fragment = document.createDocumentFragment();
  visible.forEach(store => {
    const card = element('article', 'restaurant-card');
    const top = element('div', 'card-top');
    const icon = element('span', 'genre-icon' + (store.tone ? ' tone-' + store.tone : ''), store.icon || '◌');
    icon.setAttribute('aria-hidden', 'true');
    top.append(icon, element('span', 'card-source', store.source));
    const tags = element('div', 'card-tags');
    if (store.genre) tags.append(element('span', 'tag genre-tag', store.genre));
    store.tags.forEach(tag => tags.append(element('span', 'tag', tag)));
    const bottom = element('div', 'card-bottom');
    const edit = element('button', 'edit-button', 'メモを編集 ↗');
    edit.type = 'button'; edit.setAttribute('aria-label', store.name + 'を編集');
    edit.addEventListener('click', () => openManual(store));
    bottom.append(element('span', '', 'a little favorite.'), edit);
    card.append(top, element('h3', '', store.name), element('p', 'card-address', store.address || '住所のメモはまだありません'), tags);
    if (store.memo) card.append(element('p', 'card-memo', store.memo));
    card.append(bottom); fragment.append(card);
  });
  grid.replaceChildren(fragment);
  $('#empty-state').hidden = visible.length > 0;
}

function announce(message) { $('#status').textContent = message; }
function openDialog(id, origin = document.activeElement) {
  if(document.querySelector('dialog[open]')) return false;
  dialogOrigins.set(id,origin);document.getElementById(id).showModal();return true;
}
document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('close',()=>dialogOrigins.get(dialog.id)?.focus()));
function commitState(result, redraw = true) {
  state=result.nextState;serialized=result.serialized;stateRevision++;dirty=true;
  $('#manual-overline').textContent=state.fieldSettings.filter(f=>f.required).length>1?'項目設定に合わせて入力':'店名だけでもOK';if(redraw)render();
}
function formError(target,error) {
  const field=state.fieldSettings.find(f=>f.id===error.fieldId);
  $(target).textContent=(field?field.label+'：':'')+error.message+(error.rowIndex?`（${error.rowIndex}行目）`:'');
  if(target==='#manual-error'&&error.fieldId) {
    const input=error.fieldId==='urls'?$('#manual-form').querySelectorAll('.url-input')[(error.rowIndex||1)-1]:$('#manual-form').elements.namedItem(error.fieldId);
    input?.setAttribute('aria-invalid','true');input?.focus();
  }
}
function openManual(store = null) {
  const form = $('#manual-form'); form.reset(); $('#manual-error').textContent = '';
  manualId=store?.id||null;renderManualFields($('#manual-fields'),state.fieldSettings,store);
  $('#manual-title').textContent = store ? 'お店のメモを編集' : 'お店をメモする';
  form.querySelector('[type=submit]').textContent = store ? 'この画面で更新' : 'この画面に追加';
  openDialog('manual-dialog');
}

$('#add-button').addEventListener('click', () => openManual());
$('#manual-form').addEventListener('submit', event => {
  event.preventDefault();
  if(submitting||!$('#manual-dialog').open)return;
  submitting=true;$('#manual-error').textContent='';
  $('#manual-form').querySelectorAll('[aria-invalid]').forEach(input=>input.removeAttribute('aria-invalid'));
  try {
    const result=applyManualDraft(state,{id:manualId,values:readManualValues(event.currentTarget,state.fieldSettings)});
    commitState(result);$('#manual-dialog').close();announce('この画面内だけで保持しています。必要なら店舗＋設定のJSONを書き出してください。');
  } catch (error) { formError('#manual-error',error); }
  finally {submitting=false;}
});

function settingsChanged(next, {redraw=false,focusId,direction} = {}) {
  settingsDraft=next;
  if(redraw)renderSettingsFields($('#settings-fields'),settingsDraft,settingsChanged);
  $('#add-custom-field').disabled=settingsDraft.filter(f=>f.kind==='text').length>=MAX_CUSTOM_FIELDS;
  const labels=settingsDraft.map(f=>f.label.trim());$('#settings-note').textContent=new Set(labels).size<labels.length?'同名の項目があります。元の項目名や短いIDで区別してください。':'';
  if(focusId) {
    const row=$('#settings-fields').querySelector(`[data-field-id="${focusId}"]`);
    (row.querySelector(`[data-move="${direction}"]:not(:disabled)`)||row.querySelector('[data-move]:not(:disabled)')||row.querySelector('input')).focus();
    $('#settings-feedback').textContent=`${settingsDraft.find(f=>f.id===focusId).label}を${settingsDraft.findIndex(f=>f.id===focusId)+1}番目に移動しました。`;
  }
}
$('#settings-button').addEventListener('click',()=>{
  settingsDraft=structuredClone(state.fieldSettings);$('#settings-error').textContent='';$('#settings-feedback').textContent='';settingsChanged(settingsDraft,{redraw:true});openDialog('settings-dialog');
});
$('#add-custom-field').addEventListener('click',()=>{
  const count=settingsDraft.filter(f=>f.kind==='text').length;if(count>=MAX_CUSTOM_FIELDS)return;
  const id='custom_'+crypto.randomUUID();settingsChanged([...settingsDraft,{id,kind:'text',label:`カスタム項目 ${count+1}`,visible:true,required:false}],{redraw:true});
  $('#settings-fields').querySelector(`[data-field-id="${id}"] input`).focus();
});
$('#reset-field-settings').addEventListener('click',()=>{
  try{settingsChanged(resetFieldSettings(settingsDraft),{redraw:true});$('#settings-error').textContent='';$('#settings-feedback').textContent='標準の表示に戻しました。カスタム定義と店舗の値は保持します。';}catch(error){formError('#settings-error',error);}
});
$('#settings-form').addEventListener('submit',event=>{
  event.preventDefault();if(!$('#settings-dialog').open)return;
  try{commitState(applyFieldSettings(state,settingsDraft),false);$('#settings-dialog').close();announce('項目設定をこの画面内に適用しました。再読み込みで消えます。');}catch(error){formError('#settings-error',error);}
});

$('#search').addEventListener('input', render); $('#sort').addEventListener('change', render);
$('#clear-search').addEventListener('click', () => { $('#search').value = ''; filter = ''; render(); });
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => document.getElementById(button.dataset.close).close()));

function resetPreview() {
  preview = null; parsed = null; previewRevision=-1; $('#import-preview').hidden = true; $('#commit-import').disabled = true;
  $('#preview-rows').replaceChildren(); $('#import-error').textContent = '';
  $('#import-mode').value='append';$('#import-mode option[value=restore]').disabled=true;$('#apply-import-settings').checked=false;$('#restore-confirm').checked=false;
}
function importOptions() {
  const mode=$('#import-mode').value;
  return {mode,applySettings:mode==='restore'||$('#apply-import-settings').checked,includeDuplicates:$('#include-duplicates').checked,createId:()=>crypto.randomUUID()};
}
function updatePreview() {
  if(!parsed)return;
  const options=importOptions(),restore=options.mode==='restore';
  $('#restore-section').hidden=!restore;$('#apply-settings-label').hidden=restore;$('#duplicates-label').hidden=restore;
  $('#restore-description').textContent=`現在の${state.stores.length}店舗と項目設定を、このファイルの${parsed.rows.length}店舗と設定で置き換えます。必要なら現在のJSONを先に書き出してください。`;
  $('#apply-import-settings').disabled=parsed.format!=='backup-v2';
  preview=prepareImport(state,parsed,options);previewRevision=stateRevision;
  $('#preview-summary').replaceChildren(...[`追加可能 ${preview.counts.valid}件`,`重複 ${preview.counts.duplicate}件`,`要修正 ${preview.counts.invalid}件`,`注意 ${preview.counts.warning}件`].map(text=>element('span','',text)));
  $('#column-mapping').textContent='列の対応：'+parsed.mapping.join(' / ');
  const rows=$('#preview-rows');rows.replaceChildren();
  preview.rows.slice(0,100).forEach(row=>{
    const node=element('div','preview-row');node.append(element('span','',row.record?.name||`行${row.index}：${row.error}`),element('small','',row.status==='invalid'?'要修正':row.status==='duplicate'?(options.includeDuplicates?'追加':'スキップ'):'追加'));rows.append(node);
  });
  $('#preview-overflow').textContent=preview.rows.length>100?`最初の100件を表示。候補全体は${preview.rows.length}件です。`:'';
  $('#import-details').textContent=[...parsed.warnings,...preview.fieldChanges,...preview.rows.filter(row=>row.error||row.warnings.length).map(row=>`行${row.index}：${[row.error,...row.warnings].filter(Boolean).join(' ')}`),...(preview.serialized?[`反映後の容量 ${(preview.serialized.bytes/1048576).toFixed(2)} / 8 MiB`]:[])].join('\n');
  $('#import-error').textContent=preview.error;$('#import-preview').hidden=false;
  $('#commit-import').textContent=restore?'店舗と設定を置き換える':'確認してこの画面に追加';$('#commit-import').disabled=!preview.nextState||(restore&&!$('#restore-confirm').checked);
}
$('#import-button').addEventListener('click', () => { fileGeneration++;resetPreview();$('#include-duplicates').checked=false;$('#file-input').value='';openDialog('import-dialog'); });
$('#import-dialog').addEventListener('close', () => { fileGeneration++; resetPreview(); $('#file-input').value = ''; });
for(const id of ['import-mode','apply-import-settings','include-duplicates','restore-confirm'])$('#'+id).addEventListener('change',()=>{if(id==='import-mode')$('#restore-confirm').checked=false;updatePreview();});
$('#file-input').addEventListener('change', async event => {
  const generation = ++fileGeneration; resetPreview();
  const file = event.currentTarget.files[0];
  if (!file) return;
  try {
    if (!/\.(csv|json)$/i.test(file.name)) throw new Error('CSVまたはJSONを選択してください。ZIPは未対応です。');
    const csv=/\.csv$/i.test(file.name);if(file.size>(csv?MAX_BYTES:MAX_JSON_BYTES))throw new Error(`${csv?'CSVは2':'JSONは8'} MiBまでです。`);
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (generation !== fileGeneration || !$('#import-dialog').open) return;
    parsed=parseImport(decodeImportFile(bytes,file.name),file.name);$('#import-mode option[value=restore]').disabled=parsed.format!=='backup-v2';updatePreview();
  } catch (error) { if (generation === fileGeneration) { resetPreview(); $('#import-error').textContent = error.message; } }
});
$('#commit-import').addEventListener('click', () => {
  if(submitting||!parsed||!preview?.nextState||!$('#import-dialog').open)return;
  if(previewRevision!==stateRevision){$('#restore-confirm').checked=false;updatePreview();announce('手帳が変わったため、再度プレビューを確認してください。');return;}
  const options=importOptions();if(options.mode==='restore'&&!$('#restore-confirm').checked)return;
  submitting=true;$('#commit-import').disabled=true;
  try {
    const candidate=prepareImport(state,parsed,options);if(!candidate.nextState)throw new Error(candidate.error);
    commitState(candidate);$('#import-dialog').close();announce('店舗と設定をこの画面内に反映しました。元ファイルは変更していません。再読み込みで消えます。');
  } catch(error){$('#import-error').textContent=error.message;}finally{submitting=false;}
});

function downloadBackup() {
  try {
  const url = URL.createObjectURL(new Blob([serialized.json], { type: 'application/json;charset=utf-8' }));
  const link = element('a'); link.href = url; link.download = 'gourmet-notebook.json';
  document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
  announce('店舗＋設定JSONのダウンロードを開始しました。保存できたか確認してください。画面内のデータと設定は再読み込みで消えます。');
  }catch(error){announce('JSONを書き出せませんでした。画面内の内容は保持しています。');}
}
$('#export-button').addEventListener('click',downloadBackup);$('#export-before-restore').addEventListener('click',downloadBackup);
function updateEstimate() {
  const field = $('#estimate-count');
  try {
    if (!field.value.trim()) throw new Error('店舗数を入力してください。');
    const count = Number(field.value), tickets = ticketsFor(count);
    $('#estimate-result').textContent = count === 0 ? '0件：処理なし・消費0枚（見積例）' : tickets > 5 ? `${count}件：${tickets}枚必要。デモ残数5枚では不足します。購入機能は未実装です。` : `消費予定${tickets}枚（見積例）。デモ残数5枚 → ${5 - tickets}枚。実際の消費はありません。`;
  } catch (error) { $('#estimate-result').textContent = error.message; }
}
$('#estimate-count').addEventListener('input', updateEstimate);
$('#classification-button').addEventListener('click', () => { updateEstimate(); openDialog('classification-dialog'); });
$('#about-button').addEventListener('click', () => openDialog('about-dialog'));
window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
render();
