import {restaurantValue,serializeState,validateFieldSettings} from '../model.js';
import {VALUE_KEYS,ELIGIBLE_FIELDS,clone,fail,hashValue,canonicalJson,byteLength} from './common.js';
import {projectPublicRow} from './source.js';
import {PUBLIC_RESEARCH_PROMPT,PUBLIC_RESEARCH_PROMPT_VERSION} from './prompt.js';
const depsDefault={createId:()=>crypto.randomUUID(),now:()=>new Date().toISOString()};
export function findCandidate(session,id){const c=session.candidates.find(c=>c.id===id);if(!c)fail('CANDIDATE','対応する候補がありません。');return c;}
export async function makeBinding(store){const v=restaurantValue(store);return {recordId:store.id,fieldVersions:Object.fromEntries(VALUE_KEYS.map(k=>[k,0])),fieldValueHashes:Object.fromEntries(await Promise.all(VALUE_KEYS.map(async k=>[k,await hashValue(v[k])]))),protectedFields:[]};}
export async function createResearchSession(notebook,extracted,deps=depsDefault){
 serializeState(notebook);const {createId,now}=deps;const candidates=[];
 for(const e of extracted.candidates){const urlJobs=[];for(const url of e.baseRestaurant.urls)urlJobs.push({id:createId(),url,urlHash:await hashValue(url),status:e.status,activeRequestId:'',attempts:[]});candidates.push({...clone(e),id:createId(),revision:0,activeRequest:{},result:{},review:{applyStatus:'unapplied',identityChecks:[],requestBindings:{},results:{},targetNeedsConfirmation:false,manualEdits:[]},urlJobs,targetRecordId:'',history:[],rawReceipt:{}});}
 return {source:clone(extracted.source),workspaceId:createId(),runManifest:{kind:'local-json-exchange',createdAt:now(),promptVersion:PUBLIC_RESEARCH_PROMPT_VERSION,promptHash:await hashValue(PUBLIC_RESEARCH_PROMPT),applyPolicy:{revision:0,allowSequential:false,allowedFields:[],confirmedAt:''}},candidates,recordBindings:await Promise.all(notebook.stores.map(makeBinding)),applicationReceipts:[]};
}
export async function prepareRequest(session,candidateId,urlJobId,fieldSettings,deps=depsDefault){
 const nextSession=clone(session),c=findCandidate(nextSession,candidateId),job=c.urlJobs.find(j=>j.id===urlJobId);if(!job||c.status==='invalid')fail('REQUEST','この候補の要求は作れません。');
 if(job.activeRequestId&&['waiting','running'].includes(job.status))return {nextSession,transport:clone(c.activeRequest.transport)};
 const settingsSnapshot=validateFieldSettings(fieldSettings);c.revision++;const requestId=deps.createId();
 const request={researchMode:'public_research',promptVersion:PUBLIC_RESEARCH_PROMPT_VERSION,requestId,workspaceId:session.workspaceId,candidateId:c.id,candidateRevision:c.revision,urlJobId:job.id,settingsHash:await hashValue(settingsSnapshot),inputProfile:'source-projected',sourceRedacted:true,sharedColumns:['タイトル','URL'],sourceRow:projectPublicRow(c.sourceRow,job.url),fieldDefinitions:[]};
 if(byteLength(canonicalJson(request))+byteLength(PUBLIC_RESEARCH_PROMPT)>32*1024)fail('REQUEST_CAPACITY','1件の要求とプロンプトが32 KiBを超えます。');
 const transport={inputHash:await hashValue(request),request},attempt={transport,settingsSnapshot,createdAt:deps.now(),startedAt:'',status:'waiting',resultHash:''};
 const binding=nextSession.recordBindings.find(b=>b.recordId===c.targetRecordId);if(binding)c.review.requestBindings[requestId]=clone(binding);
 c.activeRequest=clone(attempt);c.history.push(clone(attempt));job.attempts.push(clone(attempt));job.activeRequestId=requestId;job.status='waiting';c.status='waiting';c.result={};return {nextSession,transport};
}
export function cancelCandidate(session,id,{now=depsDefault.now}={}){
 const next=clone(session),c=findCandidate(next,id);for(const j of c.urlJobs){j.status='cancelled';j.activeRequestId='';for(const a of j.attempts)if(a.status==='waiting'||a.status==='running')a.status='cancelled';}
 for(const a of c.history)if(a.status==='waiting'||a.status==='running')a.status='cancelled';c.activeRequest={};c.status='cancelled';c.review.cancelledAt=now();return next;
}
export async function retryUrlJob(session,id,jobId,settings,deps=depsDefault){const next=clone(session),c=findCandidate(next,id),j=c.urlJobs.find(j=>j.id===jobId);if(!j)fail('JOB','URL要求がありません。');if(c.activeRequest.transport){const old=c.activeRequest.transport.request.requestId;for(const a of [...c.history,...j.attempts])if(a.transport.request.requestId===old)a.status='cancelled';}j.activeRequestId='';c.activeRequest={};return prepareRequest(next,id,jobId,settings,deps);}
export function bindCandidateTarget(session,id,recordId){const next=clone(session),c=findCandidate(next,id);if(c.targetRecordId&&c.targetRecordId!==recordId)fail('TARGET','登録済み候補の対象は変更できません。');c.targetRecordId=recordId;return next;}
export function assertActive(session,c,exchange){const a=c.activeRequest,j=c.urlJobs.find(j=>j.id===exchange.urlJobId);if(exchange.workspaceId!==session.workspaceId||exchange.candidateId!==c.id||exchange.candidateRevision!==c.revision||!a.transport||a.transport.request.requestId!==exchange.requestId||a.transport.inputHash!==exchange.inputHash||!j||j.activeRequestId!==exchange.requestId||c.status==='cancelled')fail('STALE','取消済み・古い・別作業の結果です。');}
export function acceptResearchResult(session,validated,{now=depsDefault.now}={}){
 const next=clone(session),e=validated.exchange,c=findCandidate(next,e.candidateId);assertActive(next,c,e);const previous=c.activeRequest.resultHash;if(previous){if(previous!==validated.resultHash)fail('RESULT_CONFLICT','同じ要求に異なる結果が届きました。');return next;}
 c.result=clone(validated);c.review.results[e.requestId]=clone(validated);c.status=validated.identityVerified?'confirmed':'needs_review';c.review.receivedAt=now();c.activeRequest.status=c.status;c.activeRequest.resultHash=validated.resultHash;
 const j=c.urlJobs.find(j=>j.id===e.urlJobId);j.status=c.status;for(const a of [...c.history,...j.attempts])if(a.transport.request.requestId===e.requestId){a.status=c.status;a.resultHash=validated.resultHash;}
 return next;
}
export function researchCounts(session){const counts={waiting:0,running:0,confirmed:0,needs_review:0,failed:0,cancelled:0,invalid:0,applied:0};for(const c of session.candidates){counts[c.status]++;if(c.review.applyStatus==='applied')counts.applied++;}return counts;}
export async function reconcileNotebookChange(snapshot,nextNotebook,intent,deps=depsDefault){
 serializeState(nextNotebook);if(!snapshot.session)return {baseRevision:snapshot.revision,nextNotebook:clone(nextNotebook),nextSession:null,receipt:{},message:'保存しました。'};
 if(!['manual','settings','append'].includes(intent.kind))fail('ACTIVE_SESSION','作業backupを保存して研究作業を明示終了してから置換してください。');
 const next=clone(snapshot.session);const touched=[...new Set([...(intent.changedFields||[]),...(intent.clearedFields||[])].map(k=>k.startsWith('custom_')?'customValues':k))];
 for(const store of nextNotebook.stores){let binding=next.recordBindings.find(b=>b.recordId===store.id);if(!binding){next.recordBindings.push(await makeBinding(store));continue;}
  for(const k of VALUE_KEYS){const hash=await hashValue(restaurantValue(store)[k]);const touch=intent.kind==='manual'&&(!intent.recordId||intent.recordId===store.id)&&touched.includes(k);if(hash!==binding.fieldValueHashes[k]||touch){binding.fieldVersions[k]++;binding.fieldValueHashes[k]=hash;if(intent.kind==='manual'&&!binding.protectedFields.includes(k))binding.protectedFields.push(k);if(['name','urls'].includes(k))for(const c of next.candidates.filter(c=>c.targetRecordId===store.id)){c.status='needs_review';c.review.targetNeedsConfirmation=true;for(const a of [...c.history,...c.urlJobs.flatMap(j=>j.attempts)])if(a.transport.request.requestId===c.activeRequest.transport?.request.requestId)a.status='cancelled';c.activeRequest={};for(const j of c.urlJobs){j.activeRequestId='';j.status='needs_review';}}}}
 }
 if(intent.kind==='manual')for(const c of next.candidates.filter(c=>c.targetRecordId===intent.recordId)){if(touched.length)c.review.manualEdits.push({fields:touched,at:deps.now(),note:'本人の手動編集。推測候補があっても外部確認済み事実へ格上げしない。'});}
 next.recordBindings=nextNotebook.stores.map(s=>next.recordBindings.find(b=>b.recordId===s.id));
 if(intent.kind==='settings')for(const c of next.candidates){if(c.activeRequest.transport){for(const a of [...c.history,...c.urlJobs.flatMap(j=>j.attempts)])if(a.transport.request.requestId===c.activeRequest.transport.request.requestId)a.status='cancelled';c.activeRequest={};c.status=c.status==='invalid'?'invalid':'needs_review';for(const j of c.urlJobs){j.activeRequestId='';if(j.status!=='invalid')j.status='needs_review';}}}
 return {baseRevision:snapshot.revision,nextNotebook:clone(nextNotebook),nextSession:next,receipt:{},message:'手帳と研究作業を保存しました。'};
}
export function recordIdentityReview(session,id,{decision,sourceIds,note,now=depsDefault.now}){if(!['hold','human_confirmed'].includes(decision)||!Array.isArray(sourceIds)||typeof note!=='string'||note.length>1000)fail('REVIEW','確認記録が不正です。');const next=clone(session),c=findCandidate(next,id),sources=c.result.exchange?.result.sources??[];if(sourceIds.some(id=>!sources.some(s=>s.id===id)))fail('REVIEW','確認した出典がありません。');c.review.identityChecks.push({decision,sourceIds:[...sourceIds],note,at:typeof now==='function'?now():now});if(decision==='hold')c.review.applyStatus='held';return next;}
