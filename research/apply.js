import {serializeState,normalizeRestaurant,restaurantValue} from '../model.js';
import {clone,fail,hashValue,canonicalJson,ELIGIBLE_FIELDS,VALUE_KEYS} from './common.js';
import {findCandidate,makeBinding,assertActive,acceptResearchResult} from './session.js';
export function previewRawRegistration(snapshot,decisions={}){
 const rows=snapshot.session.candidates.map(c=>({candidateId:c.id,name:c.baseRestaurant.name,status:c.status,decision:decisions[c.id]??{mode:'hold'},duplicateCandidateIds:snapshot.session.candidates.filter(other=>other.id!==c.id&&(canonicalJson(other.baseRestaurant)===canonicalJson(c.baseRestaurant)||other.baseRestaurant.urls.some(url=>c.baseRestaurant.urls.includes(url)))).map(other=>other.id),duplicateRecordIds:snapshot.notebook.stores.filter(s=>s.id!==c.targetRecordId&&(canonicalJson(restaurantValue(s))===canonicalJson(c.baseRestaurant)||s.urls.some(url=>c.baseRestaurant.urls.includes(url))||s.name===c.baseRestaurant.name&&s.address&&s.address===c.baseRestaurant.address)).map(s=>s.id)}));
 return {rows,counts:{total:rows.length,invalid:rows.filter(r=>r.status==='invalid').length,duplicates:rows.filter(r=>r.duplicateRecordIds.length||r.duplicateCandidateIds.length).length}};
}
async function receipt(session,c,requestId,before,after,patch){return {workspaceId:session.workspaceId,candidateId:c.id,acceptedRequestId:requestId,targetRecordId:c.targetRecordId,policyRevision:session.runManifest.applyPolicy.revision,patchHash:await hashValue(patch),beforeFieldVersions:clone(before.fieldVersions),afterFieldVersions:clone(after.fieldVersions),beforeFieldHashes:clone(before.fieldValueHashes),afterFieldHashes:clone(after.fieldValueHashes)};}
export async function prepareRawRegistration(snapshot,decisions,deps){
 const notebook=clone(snapshot.notebook),session=clone(snapshot.session);let latest={};
 for(const [id,decision]of Object.entries(decisions)){
  const c=findCandidate(session,id);if(c.targetRecordId){if(c.review.targetNeedsConfirmation&&decision.mode==='existing'&&decision.recordId===c.targetRecordId)c.review.targetNeedsConfirmation=false;continue;}if(!['new','existing','hold'].includes(decision.mode))fail('DECISION','新規・既存・保留を選択してください。');if(decision.mode==='hold'){c.review.applyStatus='held';continue;}
  if(c.status==='invalid')fail('INVALID_ROW','不正行を登録できません。');let store;
  if(decision.mode==='new'){store={...normalizeRestaurant(c.baseRestaurant,notebook.fieldSettings),id:deps.createId(),source:'CSV原値',icon:'◌',tone:'green'};notebook.stores.push(store);session.recordBindings.push(await makeBinding(store));}
  else{store=notebook.stores.find(s=>s.id===decision.recordId);if(!store)fail('TARGET','既存店舗がありません。');}
  c.targetRecordId=store.id;const b=session.recordBindings.find(b=>b.recordId===store.id);if(!b)fail('BINDING','対象の台帳がありません。');c.review.rawMode=decision.mode;c.review.applyStatus='raw_registered';
  if(c.activeRequest.transport&&!Object.hasOwn(c.review.requestBindings,c.activeRequest.transport.request.requestId))c.review.requestBindings[c.activeRequest.transport.request.requestId]=clone(b);
  latest=await receipt(session,c,'raw-only',b,b,decision.mode==='new'?restaurantValue(store):{});c.rawReceipt=clone(latest);session.applicationReceipts.push(latest);
 }
 serializeState(notebook);return {baseRevision:snapshot.revision,nextNotebook:notebook,nextSession:session,receipt:latest,message:'原値と対象対応を登録しました。'};
}
export function previewResultApplication(snapshot,id,validated){
 const c=findCandidate(snapshot.session,id),e=validated.exchange,patch={},blockedFields=[],reasons=[];assertActive(snapshot.session,c,e);
 const store=snapshot.notebook.stores.find(s=>s.id===c.targetRecordId),binding=snapshot.session.recordBindings.find(b=>b.recordId===c.targetRecordId),captured=c.review.requestBindings[e.requestId];
 if(!store||!binding||!captured)return {patch,blockedFields:[...ELIGIBLE_FIELDS],reasons:['最初に登録先を確認してください。'],targetRecordId:c.targetRecordId};
 if(!validated.identityVerified||e.result.needsReview.length||c.review.applyStatus==='held'||c.review.targetNeedsConfirmation)return {patch,blockedFields:[...ELIGIBLE_FIELDS],reasons:['店舗同定・要確認項目を確認してください。自動補完は保留です。'],targetRecordId:c.targetRecordId};
 for(const k of ELIGIBLE_FIELDS){if(!validated.eligibleFields.includes(k))continue;if(store[k]!==''||binding.protectedFields.includes(k)||binding.fieldVersions[k]!==captured.fieldVersions[k]||binding.fieldValueHashes[k]!==captured.fieldValueHashes[k]){blockedFields.push(k);reasons.push(`${k}: 原値・手入力・明示クリアを保護しました。`);}else patch[k]=e.result.restaurant[k];}
 return {patch,blockedFields,reasons,targetRecordId:c.targetRecordId};
}
export async function prepareResultApplication(snapshot,id,validated,{mode='manual',selectedFields=ELIGIBLE_FIELDS}={},deps){
 const e=validated.exchange,original=findCandidate(snapshot.session,id);assertActive(snapshot.session,original,e);const prior=snapshot.session.applicationReceipts.find(r=>r.candidateId===id&&r.acceptedRequestId===e.requestId);
 if(prior){if(original.result.resultHash&&original.result.resultHash!==validated.resultHash)fail('RESULT_CONFLICT','既存receiptと異なる結果です。');return {baseRevision:snapshot.revision,nextNotebook:clone(snapshot.notebook),nextSession:clone(snapshot.session),receipt:clone(prior),message:'この要求は反映済みです。'};}
 if(!['manual','sequential'].includes(mode)||!Array.isArray(selectedFields)||selectedFields.some(k=>!ELIGIBLE_FIELDS.includes(k)))fail('APPLY_MODE','反映項目を確認してください。');
 const policy=snapshot.session.runManifest.applyPolicy;if(mode==='sequential'&&!policy.allowSequential)fail('POLICY','順次補完方針が未許可です。');
 if(await hashValue(snapshot.notebook.fieldSettings)!==original.activeRequest.transport.request.settingsHash)fail('SETTINGS_STALE','要求後に項目設定が変わりました。');
 const preview=previewResultApplication(snapshot,id,validated);if(!validated.identityVerified||e.result.needsReview.length||original.review.applyStatus==='held'||original.review.targetNeedsConfirmation)fail('IDENTITY_HOLD','同定・出典の要確認を保留しました。');
 const patch=Object.fromEntries(Object.entries(preview.patch).filter(([k])=>mode==='sequential'?policy.allowedFields.includes(k):selectedFields.includes(k)));
 let session=acceptResearchResult(snapshot.session,validated,deps),notebook=clone(snapshot.notebook),c=findCandidate(session,id);if(!Object.keys(patch).length)return {baseRevision:snapshot.revision,nextNotebook:notebook,nextSession:session,receipt:{},message:preview.reasons.join(' ')||'補完可能な空欄はありません。'};
 const index=notebook.stores.findIndex(s=>s.id===c.targetRecordId),binding=session.recordBindings.find(b=>b.recordId===c.targetRecordId),before=clone(binding);if(index<0)fail('TARGET','登録先がありません。');
 for(const k of VALUE_KEYS)if(await hashValue(restaurantValue(notebook.stores[index])[k])!==binding.fieldValueHashes[k])fail('BINDING_STALE','現在値と台帳が一致しません。');
 notebook.stores[index]={...notebook.stores[index],...normalizeRestaurant({...restaurantValue(notebook.stores[index]),...patch},notebook.fieldSettings)};
 for(const k of Object.keys(patch)){binding.fieldVersions[k]++;binding.fieldValueHashes[k]=await hashValue(patch[k]);}
 const r=await receipt(session,c,e.requestId,before,binding,patch);session.applicationReceipts.push(r);c.review.applyStatus='applied';serializeState(notebook);return {baseRevision:snapshot.revision,nextNotebook:notebook,nextSession:session,receipt:r,message:'検証済みの空欄を補完しました。'};
}
