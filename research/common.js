export const VALUE_KEYS=['name','genre','phone','address','tags','memo','urls','customValues'];
export const ELIGIBLE_FIELDS=['address','phone','genre'];
export const MAX_SESSION_BYTES=16*1024*1024;
export const MAX_EXCHANGE_BYTES=64*1024;
export class ResearchError extends Error {
 constructor(code,message,context={}){super(message);this.name='ResearchError';this.code=code;this.context=context;}
}
export const fail=(code,message,context)=>{throw new ResearchError(code,message,context);};
export const clone=value=>structuredClone(value);
export const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&[Object.prototype,null].includes(Object.getPrototypeOf(v));
export const byteLength=text=>new TextEncoder().encode(text).byteLength;
export function assertExactKeys(obj,keys){if(!isObject(obj)||Object.keys(obj).length!==keys.length||keys.some(k=>!Object.hasOwn(obj,k)))fail('SCHEMA','項目が不足しているか未知の項目があります。');return obj;}
export function canonicalJson(value){
 const visit=v=>{if(v===null||typeof v==='boolean'||typeof v==='string')return JSON.stringify(v);if(typeof v==='number'&&Number.isFinite(v))return JSON.stringify(v);if(Array.isArray(v))return '['+v.map(visit).join(',')+']';if(isObject(v))return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+visit(v[k])).join(',')+'}';fail('CANONICAL','ハッシュ対象の値が不正です。');};
 return visit(value);
}
export async function sha256Bytes(bytes){if(!(bytes instanceof Uint8Array))fail('BYTES','バイト列が必要です。');const digest=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');}
export const hashValue=value=>sha256Bytes(new TextEncoder().encode(canonicalJson(value)));
export function assertPublicUrl(value){
 if(typeof value!=='string'||/[\u0000-\u001f\u007f]/.test(value))fail('URL','URLに制御文字があります。');
 const text=value.trim();if(!text||text.length>2000)fail('URL','URLは1〜2,000文字です。');
 let u;try{u=new URL(text);}catch{fail('URL','URLの形式が不正です。');}
 if(!['http:','https:'].includes(u.protocol)||u.username||u.password)fail('URL','認証情報なしのhttp/https URLだけです。');return text;
}
export function parseStrictJson(text,{maxBytes=MAX_SESSION_BYTES,maxDepth=16}={}){
 if(typeof text!=='string'||byteLength(text)>maxBytes)fail('CAPACITY','JSON容量上限を超えています。');
 let p=0;const bad=()=>fail('JSON','JSONの形式・重複キー・深さを確認してください。');
 const space=()=>{while(/[ \r\n\t]/.test(text[p]??'x'))p++;};
 const string=()=>{const start=p++;while(p<text.length){const c=text[p++];if(c==='"'){try{return JSON.parse(text.slice(start,p));}catch{bad();}}if(c==='\\')p++;else if(c.charCodeAt(0)<32)bad();}bad();};
 const value=depth=>{space();const c=text[p];if(c==='{'||c==='['){if(depth>=maxDepth)bad();p++;space();const object=c==='{',end=object?'}':']',out=object?{}:[],seen=new Set();if(text[p]===end){p++;return out;}while(true){if(object){if(text[p]!=='"')bad();const key=string();if(seen.has(key))bad();seen.add(key);space();if(text[p++]!==':')bad();const v=value(depth+1);Object.defineProperty(out,key,{value:v,enumerable:true,writable:true,configurable:true});}else out.push(value(depth+1));space();if(text[p]===end){p++;return out;}if(text[p++]!==',')bad();space();}}
 if(c==='"')return string();for(const [lit,v]of[['true',true],['false',false]])if(text.startsWith(lit,p)){p+=lit.length;return v;}
 const match=text.slice(p).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);if(!match)bad();p+=match[0].length;const n=Number(match[0]);if(!Number.isFinite(n))bad();return n;};
 const result=value(0);space();if(p!==text.length)bad();return result;
}
export function decodeUtf8(bytes,maxBytes){if(!(bytes instanceof Uint8Array)||bytes.length>maxBytes)fail('CAPACITY','ファイル容量上限を超えています。');try{return new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{fail('ENCODING','UTF-8ファイルを選択してください。');}}
export const encodeBase64=bytes=>{let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s);};
export function decodeBase64(s){if(typeof s!=='string'||s.length%4||! /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(s))fail('BASE64','原本バイト列が不正です。');return Uint8Array.from(atob(s),c=>c.charCodeAt(0));}
export function textLimit(v,max){if(typeof v!=='string'||v.length>max)fail('SCHEMA','文字列の型・長さが不正です。');return v;}
export function stringList(v,max=20,length=300){if(!Array.isArray(v)||v.length>max)fail('SCHEMA','配列の上限を超えています。');v.forEach(x=>textLimit(x,length));return v;}
export function uniqueIds(items,key='id'){const seen=new Set();for(const item of items){const id=item[key];if(typeof id!=='string'||!id||seen.has(id))fail('ID','識別子が不正または重複しています。');seen.add(id);}return seen;}
