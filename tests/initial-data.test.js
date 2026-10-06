import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {parseImport,prepareImport} from '../importer.js';
import {applyManualDraft,restaurantValue,serializeState} from '../model.js';
const api=await import('../initial-data.js').catch(error=>{if(error.code==='ERR_MODULE_NOT_FOUND')return {};throw error;});
const initial=()=>{assert.equal(typeof api.createInitialNotebook,'function','approved initial notebook must be implemented');return api.createInitialNotebook();};
const options=state=>({mode:'append',applySettings:false,includeDuplicates:false,createId:()=>crypto.randomUUID(),preserveRecord:record=>api.isInitialReplay(state.stores,record)});

test('approved initial notebook has exactly 11 final records and no fabricated unknowns',()=>{
 const state=initial();assert.equal(state.stores.length,11);
 assert.deepEqual(state.stores.map(restaurantValue),api.initialNotebook.restaurants);
 assert.equal(state.stores.filter(s=>s.address).length,8);assert.equal(state.stores.filter(s=>s.phone).length,7);assert.equal(state.stores.filter(s=>s.genre).length,8);
 for(const index of [3,6,7])for(const key of ['address','phone','genre'])assert.equal(state.stores[index][key],'');
 assert.equal(state.stores[9].phone,'');assert.deepEqual(JSON.parse(serializeState(state).json),api.initialNotebook);
});
test('initial data preserves historical source confidence and field evidence for all 11',()=>{
 const state=initial();assert.equal(api.initialResearch.length,11);
 assert.equal(api.initialResearch.filter(r=>r.identity==='maps_id_matched').length,6);
 assert.equal(api.initialResearch.filter(r=>r.identity==='public_maps_encoded_id_matched').length,2);
 for(const store of state.stores){const info=api.initialResearchFor(store);assert.ok(info.sources.length);assert.ok(info.confidence);assert.equal(info.observedAt,'2026-10-05');assert.deepEqual(Object.keys(info.fieldEvidence).sort(),['address','customValues','genre','memo','name','phone','tags','urls'].sort());}
 for(const index of [3,6,7])assert.match(api.initialResearchFor(state.stores[index]).confidence,/未確認/);
 assert.equal(api.initialResearchFor(state.stores[9]).fieldEvidence.phone.status,'unknown');
});
test('initial state clones reset without mutating the public seed',()=>{
 const first=initial();first.stores[0].memo='本人の編集';first.stores[0].tags.push('本人タグ');first.fieldSettings[0].label='変更';
 const reset=initial();assert.notEqual(reset.stores[0].memo,'本人の編集');assert.ok(!reset.stores[0].tags.includes('本人タグ'));assert.equal(reset.fieldSettings[0].label,'店名');
});
test('reimporting final JSON skips 11 and preserves edits rather than reseeding',()=>{
 let state=initial();state=applyManualDraft(state,{id:state.stores[0].id,values:{memo:'本人編集を保持',phone:''}}).nextState;
 const parsed=parseImport(JSON.stringify(api.initialNotebook),'initial.json');const preview=prepareImport(state,parsed,options(state));
 assert.equal(preview.counts.duplicate,11);assert.equal(preview.counts.valid,0);assert.equal(preview.nextState,null);assert.equal(state.stores[0].memo,'本人編集を保持');assert.equal(state.stores[0].phone,'');
 const explicit=prepareImport(state,parsed,{...options(state),includeDuplicates:true});assert.equal(explicit.nextState.stores.length,22);assert.equal(explicit.nextState.stores.find(s=>s.id===state.stores[0].id).memo,'本人編集を保持');
});
test('manual edits and exported JSON restoration retain the historical research association',()=>{
 const state=initial(),before=api.initialResearchFor(state.stores[0]);const edited=applyManualDraft(state,{id:state.stores[0].id,values:{name:'本人の呼び名',memo:'改行\nメモ',phone:''}}).nextState;
 assert.deepEqual(api.initialResearchFor(edited.stores[0]),before);
 const parsed=parseImport(serializeState(edited).json,'edited.json');const restored=prepareImport(state,parsed,{mode:'restore',applySettings:true,includeDuplicates:false,createId:()=>crypto.randomUUID()});
 assert.equal(restored.nextState.stores[0].memo,'改行\nメモ');assert.equal(restored.nextState.stores[0].phone,'');assert.deepEqual(api.initialResearchFor(restored.nextState.stores[0]),before);
});
test('published JSON exactly matches the initial module and authorized bytes',async()=>{
 initial();const bytes=await readFile(new URL('../examples/initial-researched-v2.json',import.meta.url));assert.deepEqual(JSON.parse(bytes),api.initialNotebook);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'8fab88fc66b45e8d1cad3ccf6b7f0c07c925cb2294d9dc6c88d4fcaade02e332');
});
test('adding another initial URL does not replace the stable historical record',()=>{
 const state=initial(),store=state.stores[1],expected=api.initialResearchFor(store);
 const edited=applyManualDraft(state,{id:store.id,values:{urls:[...store.urls,...state.stores[0].urls]}}).nextState.stores[1];
 assert.deepEqual(api.initialResearchFor(edited),expected);
 const restored={...edited,id:'restored-random-id'};assert.equal(api.initialResearchFor(restored),null);
 assert.deepEqual(api.initialResearchFor({...restored,urls:store.urls,name:'本人の別名'}),expected);
});
