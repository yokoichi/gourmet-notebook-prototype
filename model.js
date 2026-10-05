export const MAX_STORES = 2000;
export const MAX_JSON_BYTES = 8 * 1024 * 1024;
export const MAX_CUSTOM_FIELDS = 20;
export const FIELD_LIMITS = { name:200, genre:40, phone:60, address:500, memo:2000 };
export const BUILTIN_LABELS = { name:'店名', genre:'ジャンル', phone:'電話', address:'住所', tags:'タグ', memo:'メモ', urls:'URL' };
const VALUE_KEYS = [...Object.keys(BUILTIN_LABELS), 'customValues'];
const customPattern = /^custom_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value) && [Object.prototype,null].includes(Object.getPrototypeOf(value));

export class ModelError extends Error {
  constructor(code, message, fieldId) { super(message); this.name='ModelError'; this.code=code; this.fieldId=fieldId; }
}
const fail = (code,message,fieldId) => { throw new ModelError(code,message,fieldId); };
export function defaultFieldSettings() {
  return Object.entries(BUILTIN_LABELS).map(([id,label])=>({id,kind:'builtin',label,visible:true,required:id==='name'}));
}
export function validateFieldSettings(settings) {
  if (!Array.isArray(settings) || settings.length > 7+MAX_CUSTOM_FIELDS) fail('FIELD_SETTINGS','項目設定は既存7項目とカスタム20項目までです。');
  const seen = new Set(); let customs=0;
  const result = settings.map(field => {
    if (!object(field) || Object.keys(field).some(key=>!['id','kind','label','visible','required'].includes(key))) fail('FIELD_SETTINGS','項目設定の形式が不正です。');
    const {id,kind,visible,required}=field;
    if (typeof id!=='string' || seen.has(id)) fail('FIELD_SETTINGS','項目IDが不正または重複しています。');
    seen.add(id);
    if (kind==='builtin' && !Object.hasOwn(BUILTIN_LABELS,id)) fail('FIELD_SETTINGS','未知の既存項目です。');
    if (kind==='text') { if (!customPattern.test(id)) fail('FIELD_SETTINGS','カスタム項目IDが不正です。'); customs++; }
    else if (kind!=='builtin') fail('FIELD_SETTINGS','項目の種類が不正です。');
    if (typeof field.label!=='string' || !field.label.trim() || field.label.trim().length>40) fail('FIELD_SETTINGS','項目名は1〜40文字です。',id);
    if (typeof visible!=='boolean' || typeof required!=='boolean' || (required&&!visible) || (id==='name'&&(!visible||!required))) fail('FIELD_SETTINGS','店名は表示・必須です。非表示の項目は任意にしてください。',id);
    return {id,kind,label:field.label.trim(),visible,required};
  });
  if (Object.keys(BUILTIN_LABELS).some(id=>!result.some(f=>f.id===id&&f.kind==='builtin')) || customs>MAX_CUSTOM_FIELDS) fail('FIELD_SETTINGS','既存7項目が必要です。カスタムは20項目までです。');
  return result;
}
export function resetFieldSettings(settings) {
  return [...defaultFieldSettings(),...validateFieldSettings(settings).filter(f=>f.kind==='text').map(f=>({...f,visible:false,required:false}))];
}
function text(value, limit, id) {
  if (typeof value!=='string') fail('FIELD_TYPE','文字列で入力してください。',id);
  const result=value.trim();
  if (result.length>limit) fail('FIELD_LENGTH',`最大${limit}文字です。`,id);
  return result;
}
function normalizedValue(input, settings, requiredMode) {
  if (!object(input)) fail('FIELD_TYPE','店舗データの形式が不正です。');
  if (Object.keys(input).some(key=>!VALUE_KEYS.includes(key))) fail('UNKNOWN_FIELD','未対応の店舗項目があります。');
  const result={};
  for (const [id,limit] of Object.entries(FIELD_LIMITS)) result[id]=text(input[id]??'',limit,id);
  if (!result.name) fail('REQUIRED_FIELD','店名を入力してください。','name');
  const tags=input.tags??[];
  if (!Array.isArray(tags)||tags.some(tag=>typeof tag!=='string')) fail('FIELD_TYPE','タグは文字列の配列にしてください。','tags');
  result.tags=[...new Set(tags.map(tag=>tag.trim()).filter(Boolean))];
  if (result.tags.length>12||result.tags.some(tag=>tag.length>30)) fail('FIELD_LENGTH','タグは12個まで、各30文字です。','tags');
  const urls=input.urls??[];
  if (!Array.isArray(urls)||urls.length>10) fail('INVALID_URL','URLは10件までの配列にしてください。','urls');
  result.urls=[];
  for (const value of urls) {
    if (typeof value!=='string'||/[\u0000-\u001f\u007f]/.test(value)) fail('INVALID_URL','URLに不正な文字があります。','urls');
    const urlText=value.trim(); if (!urlText) continue;
    if (urlText.length>2000) fail('INVALID_URL','URLは2,000文字までです。','urls');
    let url; try { url=new URL(urlText); } catch { fail('INVALID_URL','URLの形式を確認してください。','urls'); }
    if (!['http:','https:'].includes(url.protocol)||url.username||url.password) fail('INVALID_URL','URLは認証情報なしのhttp/httpsだけです。','urls');
    if (!result.urls.includes(urlText)) result.urls.push(urlText);
  }
  const values=input.customValues??{};
  if (!object(values)) fail('FIELD_TYPE','カスタム値の形式が不正です。');
  const definitions=new Map(settings.filter(f=>f.kind==='text').map(f=>[f.id,f]));
  if (Object.keys(values).some(id=>!definitions.has(id))) fail('UNKNOWN_FIELD','未定義のカスタム項目があります。');
  result.customValues={};
  for (const id of definitions.keys()) {
    const value=text(values[id]??'',1000,id); if (value) result.customValues[id]=value;
  }
  if (requiredMode==='manual') {
    for (const field of settings.filter(f=>f.required)) {
      const value=field.kind==='text'?result.customValues[field.id]:result[field.id];
      if (!value || (Array.isArray(value)&&!value.length)) fail('REQUIRED_FIELD',`${field.label}は必須です。`,field.id);
    }
  }
  return {name:result.name,genre:result.genre,phone:result.phone,address:result.address,tags:result.tags,memo:result.memo,urls:result.urls,customValues:result.customValues};
}
export function normalizeRestaurant(input,settings,{requiredMode='import'}={}) {
  return normalizedValue(input,validateFieldSettings(settings),requiredMode);
}
export function restaurantValue(store) {
  return Object.fromEntries(VALUE_KEYS.map(key=>[key,store[key]]));
}
export function serializeState(state) {
  const fields=validateFieldSettings(state.fieldSettings);
  if (!Array.isArray(state.stores)||state.stores.length>MAX_STORES) fail('STORE_LIMIT','手帳は2,000店舗までです。');
  const ids=new Set();
  const restaurants=state.stores.map(store=>{
    if (typeof store.id!=='string'||!store.id||ids.has(store.id)) fail('STORE_ID','店舗の識別子が不正です。');
    ids.add(store.id); return normalizedValue(restaurantValue(store),fields,'import');
  });
  const json=JSON.stringify({schemaVersion:2,format:'gourmet-notebook-prototype',fieldSettings:fields,restaurants});
  const bytes=new TextEncoder().encode(json).byteLength;
  if (bytes>MAX_JSON_BYTES) fail('CAPACITY_BYTES','店舗と設定のJSONが8 MiBを超えます。入力を減らしてください。');
  return {json,bytes};
}
export function applyFieldSettings(state,settings) {
  const nextState={fieldSettings:validateFieldSettings(settings),stores:state.stores};
  return {nextState,serialized:serializeState(nextState)};
}
export function applyManualDraft(state,{id,values},createId=()=>crypto.randomUUID()) {
  const fields=validateFieldSettings(state.fieldSettings), visible=new Map(fields.filter(f=>f.visible).map(f=>[f.id,f]));
  if (!object(values)||Object.keys(values).some(key=>!visible.has(key))) fail('UNKNOWN_FIELD','表示していない項目は変更できません。');
  const index=id===null?-1:state.stores.findIndex(store=>store.id===id);
  if (id!==null&&index<0) fail('STORE_ID','編集する店舗が見つかりません。');
  const base=index<0?{name:'',genre:'',phone:'',address:'',tags:[],memo:'',urls:[],customValues:{}}:restaurantValue(state.stores[index]);
  const merged={...base,customValues:{...base.customValues}};
  for (const [key,value] of Object.entries(values)) {
    if (visible.get(key).kind==='text') merged.customValues[key]=value;
    else if (key==='tags') { if(typeof value!=='string') fail('FIELD_TYPE','タグ入力が不正です。','tags'); merged.tags=value.split(/[,;、]/); }
    else merged[key]=value;
  }
  const record=normalizedValue(merged,fields,'manual');
  const stores=[...state.stores];
  if (index<0) stores.unshift({...record,id:createId(),source:'手動入力',icon:'◌',tone:'green'});
  else stores[index]={...state.stores[index],...record,source:'手動編集'};
  const nextState={fieldSettings:fields,stores};
  return {nextState,serialized:serializeState(nextState)};
}
