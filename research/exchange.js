import {normalizeRestaurant} from '../model.js';
import {assertExactKeys,assertPublicUrl,canonicalJson,parseStrictJson,hashValue,decodeUtf8,fail,textLimit,stringList,VALUE_KEYS,ELIGIBLE_FIELDS,MAX_SESSION_BYTES,MAX_EXCHANGE_BYTES} from './common.js';
const ROOT=['format','schemaVersion','researchMode','promptVersion','requestId','workspaceId','candidateId','candidateRevision','urlJobId','inputHash','result'];
const RESULT=['restaurant','sourceRow','reviewDisposition','fieldEvidence','unknownFields','classificationCandidates','needsReview','warnings','errors','identity','sources'];
export const dateValid=s=>typeof s==='string'&&(/^(\d{4}-\d{2}-\d{2})$/.test(s)||/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(s))&&Number.isFinite(Date.parse(s))&&(s.length===10?new Date(s).toISOString().slice(0,10)===s:new Date(s).toISOString()===s||new Date(s).toISOString().replace('.000Z','Z')===s);
const max64=(1n<<64n)-1n;
function decodedIdentifier(text){
 const fid=text.match(/0x([0-9a-f]{1,16}):0x([0-9a-f]{1,16})(?![0-9a-f])/i);if(fid){const a=BigInt('0x'+fid[1]),b=BigInt('0x'+fid[2]);return {fid:`0x${a.toString(16)}:0x${b.toString(16)}`,cid:b.toString()};}
 const cid=text.match(/(?:[?&]cid=)(\d{1,20})(?:[&#]|$)/);if(cid){const n=BigInt(cid[1]);return n<=max64?{fid:'',cid:n.toString()}:null;}
 const encoded=text.match(/(?:place_id[:=]|!1s)([A-Za-z0-9_-]{27})(?:[!&#]|$)/);if(encoded){try{const bytes=Uint8Array.from(atob(encoded[1].replaceAll('-','+').replaceAll('_','/')+'='),c=>c.charCodeAt(0));if(bytes.length!==20||bytes[0]!==10||bytes[1]!==18||bytes[2]!==9||bytes[11]!==17)return null;const view=new DataView(bytes.buffer),a=view.getBigUint64(3,true),b=view.getBigUint64(12,true);return {fid:`0x${a.toString(16)}:0x${b.toString(16)}`,cid:b.toString()};}catch{return null;}}
 return null;
}
export function mapIdentifier(url){try{const u=new URL(assertPublicUrl(url));if(!/^(?:www\.|maps\.)?google\.(?:com|co\.jp)$/.test(u.hostname)||!u.pathname.startsWith('/maps'))return null;let text=u.href;for(let i=0;i<2;i++){const next=decodeURIComponent(text);if(next===text)break;text=next;}return decodedIdentifier(text);}catch{return null;}}
export function verifyIdentity(identity,originalUrl,sources){
 if(identity.status!=='matched'||identity.method==='none')return false;const original=mapIdentifier(originalUrl);if(!original)return false;
 const claimedOriginal=decodedIdentifier(identity.originalIdentifier.includes('cid=')?identity.originalIdentifier:identity.originalIdentifier.match(/^\d+$/)?'?cid='+identity.originalIdentifier:identity.originalIdentifier);
 if(!claimedOriginal||!(original.fid&&original.fid===claimedOriginal.fid||original.cid===claimedOriginal.cid))return false;
 const claimedPublic=decodedIdentifier(identity.method==='encoded_public_map_id'?'place_id:'+identity.publicIdentifier:identity.publicIdentifier.match(/^\d+$/)?'?cid='+identity.publicIdentifier:identity.publicIdentifier);
 if(!claimedPublic)return false;
 return identity.sourceIds.some(id=>{const source=sources.find(s=>s.id===id);if(!source)return false;const inUrl=mapIdentifier(source.url),found=inUrl??(['body','public_html','search_snippet','redirect_identifier'].includes(source.accessRoute)?decodedIdentifier(source.claim?.includes(identity.publicIdentifier)?(identity.method==='encoded_public_map_id'?'place_id:'+identity.publicIdentifier:identity.publicIdentifier.match(/^\d+$/)?'?cid='+identity.publicIdentifier:identity.publicIdentifier):''):null);return found&&(found.fid&&original.fid===found.fid||found.cid===original.cid)&&(found.fid&&found.fid===claimedPublic.fid||found.cid===claimedPublic.cid);});
}
export function parseResultFile(bytes,filename){
 if(typeof filename!=='string'||!filename.toLowerCase().endsWith('.json'))fail('RESULT_FILE','JSON結果を選択してください。');const obj=parseStrictJson(decodeUtf8(bytes,MAX_SESSION_BYTES),{maxBytes:MAX_SESSION_BYTES});
 if(obj.format==='gourmet-notebook-ai-exchange'){if(bytes.length>MAX_EXCHANGE_BYTES)fail('EXCHANGE_CAPACITY','結果1件は64 KiBまでです。');return {exchanges:[obj],reports:[]};}
 assertExactKeys(obj,['format','schemaVersion','exchanges']);if(obj.format!=='gourmet-notebook-ai-result-batch'||obj.schemaVersion!==1||!Array.isArray(obj.exchanges)||obj.exchanges.length>1000)fail('RESULT_BATCH','結果batchの形式が不正です。');return {exchanges:obj.exchanges,reports:[]};
}
export async function validateExchange(exchange,transport,settingsSnapshot){
 parseStrictJson(canonicalJson(exchange),{maxBytes:MAX_EXCHANGE_BYTES});assertExactKeys(exchange,ROOT);const r=transport.request;
 if(exchange.format!=='gourmet-notebook-ai-exchange'||exchange.schemaVersion!==2||exchange.researchMode!=='public_research')fail('EXCHANGE_SCHEMA','公開調査の交換v2が必要です。');
 for(const k of ['researchMode','promptVersion','requestId','workspaceId','candidateId','candidateRevision','urlJobId'])if(exchange[k]!==r[k])fail('EXCHANGE_ID','要求と結果の識別値が一致しません。');
 if(!Number.isSafeInteger(exchange.candidateRevision)||exchange.candidateRevision<0||exchange.inputHash!==transport.inputHash||await hashValue(r)!==transport.inputHash||await hashValue(settingsSnapshot)!==r.settingsHash)fail('EXCHANGE_HASH','要求・設定・入力hashが一致しません。');
 const result=assertExactKeys(exchange.result,RESULT);if(result.reviewDisposition!=='retain'||canonicalJson(result.sourceRow)!==canonicalJson(r.sourceRow))fail('SOURCE_ECHO','共有原値が一致しません。');
 assertExactKeys(result.restaurant,VALUE_KEYS);const normalized=normalizeRestaurant(result.restaurant,settingsSnapshot);if(canonicalJson(normalized)!==canonicalJson(result.restaurant))fail('RESTAURANT','正規化済み8項目の店舗値が必要です。');
 const store=result.restaurant;if(store.name!==r.sourceRow.cellsByColumn.タイトル.trim()||canonicalJson(store.urls)!==canonicalJson([r.sourceRow.cellsByColumn.URL])||store.memo!==''||store.tags.length||Object.keys(store.customValues).length)fail('PROTECTED_ECHO','名前・URL・非共有項目の原値保護に違反しています。');
 if(!Array.isArray(result.sources)||result.sources.length>10)fail('SOURCES','出典は10件までです。');const sourceIds=new Set();
 for(const s of result.sources){assertExactKeys(s,['id','url','title','observedAt','accessRoute','claim']);if(typeof s.id!=='string'||!/^[A-Za-z0-9_-]{1,64}$/.test(s.id)||sourceIds.has(s.id))fail('SOURCE_ID','出典IDが不正・重複しています。');sourceIds.add(s.id);assertPublicUrl(s.url);textLimit(s.title,200);textLimit(s.claim,500);if(!dateValid(s.observedAt)||!['body','search_snippet','public_html','redirect_identifier'].includes(s.accessRoute))fail('SOURCE_DATE','出典の観測日・取得経路が不正です。');}
 const refs=ids=>{stringList(ids,10,64);if(new Set(ids).size!==ids.length||ids.some(id=>!sourceIds.has(id)))fail('SOURCE_REF','出典参照が解決できません。');};
 stringList(result.unknownFields,8,20);if(new Set(result.unknownFields).size!==result.unknownFields.length||result.unknownFields.some(k=>!VALUE_KEYS.includes(k)))fail('UNKNOWN_FIELDS','不明項目IDが不正です。');
 if(result.unknownFields.some(k=>Array.isArray(store[k])?store[k].length>0:typeof store[k]==='object'?Object.keys(store[k]).length>0:store[k]!==''))fail('UNKNOWN_VALUE','不明項目に非空値があります。');
 assertExactKeys(result.fieldEvidence,VALUE_KEYS);const eligibleFields=[];
 for(const k of VALUE_KEYS){const e=assertExactKeys(result.fieldEvidence[k],['status','sourceIds','sourceColumn','sourceLineStart','sourceLineEnd','rule','reason']);refs(e.sourceIds);textLimit(e.rule,300);textLimit(e.reason,300);
  if(!['copied_csv','derived_csv','researched','unknown'].includes(e.status))fail('EVIDENCE','証拠の状態が不正です。');
  if(['name','urls'].includes(k)){const column=k==='name'?'タイトル':'URL';if(e.status!=='copied_csv'||e.sourceIds.length||e.sourceColumn!==column||e.sourceLineStart!==r.sourceRow.physicalLineStart||e.sourceLineEnd!==r.sourceRow.physicalLineEnd)fail('EVIDENCE_COPY','原値転記の列・行が不正です。');}
  else{if(e.sourceColumn!==''||e.sourceLineStart!==0||e.sourceLineEnd!==0)fail('EVIDENCE_POSITION','原値以外の列・行は空・0です。');if(ELIGIBLE_FIELDS.includes(k)&&store[k]){if(e.status!=='researched'||!e.sourceIds.length||result.unknownFields.includes(k))fail('EVIDENCE_MISSING','補完値に公開出典がありません。');eligibleFields.push(k);}else if(e.status!=='unknown'||e.sourceIds.length)fail('EVIDENCE_UNKNOWN','非共有・不明項目はunknownです。');}
  if(ELIGIBLE_FIELDS.includes(k)&&!store[k]&&!result.unknownFields.includes(k))fail('UNKNOWN_MISSING','空欄の調査項目を不明として記録してください。');
 }
 for(const k of ['needsReview','warnings','errors'])stringList(result[k]);if(result.errors.length)fail('RESULT_FATAL','結果に致命的なエラーがあります。');
 if(!Array.isArray(result.classificationCandidates)||result.classificationCandidates.length>10)fail('CLASSIFICATION','推測候補は10件までです。');for(const c of result.classificationCandidates){assertExactKeys(c,['placeType','genre','status','basis','sourceFields']);textLimit(c.placeType,40);textLimit(c.genre,40);textLimit(c.basis,300);stringList(c.sourceFields,2,20);if(c.status!=='candidate'||new Set(c.sourceFields).size!==c.sourceFields.length||c.sourceFields.some(k=>!r.sharedColumns.includes(k)))fail('CLASSIFICATION','推測候補の根拠が不正です。');}
 const identity=assertExactKeys(result.identity,['status','method','sourceIds','originalIdentifier','publicIdentifier','explanation']);refs(identity.sourceIds);textLimit(identity.originalIdentifier,200);textLimit(identity.publicIdentifier,200);textLimit(identity.explanation,1000);if(!['matched','unresolved','conflicting'].includes(identity.status)||!['direct_map_id','encoded_public_map_id','none'].includes(identity.method))fail('IDENTITY','店舗同定の形式が不正です。');
 const identityVerified=verifyIdentity(identity,r.sourceRow.cellsByColumn.URL,result.sources);return {exchange:structuredClone(exchange),resultHash:await hashValue(exchange),identityVerified,eligibleFields,unknownFields:[...result.unknownFields],warnings:[...result.warnings,...(identityVerified?[]:['店舗同定を検算できないため補完を保留します。'])]};
}
