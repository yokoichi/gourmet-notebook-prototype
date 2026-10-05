import test from 'node:test';
import assert from 'node:assert/strict';
import * as importer from '../importer.js';
import { serializeState } from '../model.js';
import { fixtureState, fixtureRestaurant, referenceBackup, sizedState, nextFixtureId, CUSTOM_ID } from './fixtures.mjs';
const api=name=>{assert.equal(typeof importer[name],'function',`${name} must be implemented`);return importer[name];};
const parse=(data,name='backup.json')=>api('parseImport')(typeof data==='string'?data:JSON.stringify(data),name);
const options=(overrides={})=>({mode:'append',applySettings:false,includeDuplicates:false,createId:nextFixtureId,...overrides});
const plan=(state,parsed,opts={})=>api('prepareImport')(state,parsed,options(opts));

test('legacy_csv_and_v1_migrate_maps_url',()=>{
  const csv=parse('title,phone,item_content_url,note\n合成店,+81 00 0000,https://example.invalid/place,"合成,メモ"\n','saved.csv');
  assert.equal(csv.rows[0].record.phone,'+81 00 0000');assert.deepEqual(csv.rows[0].record.urls,['https://example.invalid/place']);
  for(const data of [[{name:'合成店',mapsURL:'https://example.invalid/place'}],{schemaVersion:1,restaurants:[{name:'合成店',mapsURL:'https://example.invalid/place'}]}]) {
    const p=parse(data);assert.equal(p.format,'legacy-json');assert.deepEqual(p.rows[0].record.urls,['https://example.invalid/place']);
  }
});
test('json_2000_roundtrips',()=>{
  const state=fixtureState(2000), parsed=parse(serializeState(state).json);
  const result=plan(fixtureState(),parsed,{mode:'restore',applySettings:true});
  assert.equal(result.nextState.stores.length,2000);assert.equal(result.serialized.json,serializeState(state).json);
  assert.throws(()=>parse(referenceBackup(fixtureState(2001))));
});
test('custom_definition_merge_preserves_existing_values',()=>{
  const state=fixtureState(1,{custom:true}), incoming=fixtureState(1,{custom:true});incoming.stores[0].name='新しい合成店';
  incoming.fieldSettings.at(-1).label='ファイル側の名前';incoming.fieldSettings[0].label='ファイル店名';
  const parsed=parse(referenceBackup(incoming)),snapshot=structuredClone(state);
  const off=plan(state,parsed);assert.equal(off.nextState.fieldSettings.at(-1).label,'食べたいもの');assert.equal(off.nextState.fieldSettings[0].label,'店名');
  const on=plan(state,parsed,{applySettings:true});assert.equal(on.nextState.fieldSettings.at(-1).label,'ファイル側の名前');assert.deepEqual(on.nextState.stores.at(-1).customValues,state.stores[0].customValues);
  assert.deepEqual(state,snapshot);
});
test('unknown_custom_off_is_added_hidden_only_when_referenced',()=>{
  const incoming=fixtureState(1,{custom:true});incoming.stores[0].name='新規';
  const added=plan(fixtureState(),parse(referenceBackup(incoming)));assert.equal(added.nextState.fieldSettings.at(-1).id,CUSTOM_ID);assert.equal(added.nextState.fieldSettings.at(-1).visible,false);
  incoming.stores[0].customValues={};assert.equal(plan(fixtureState(),parse(referenceBackup(incoming))).nextState.fieldSettings.length,7);
});
test('settings_on_retains_current_only_definitions',()=>{
  const state=fixtureState(1,{custom:true}),incoming=fixtureState();incoming.stores[0].name='別店';
  const result=plan(state,parse(referenceBackup(incoming)),{applySettings:true});assert.equal(result.nextState.fieldSettings.at(-1).id,CUSTOM_ID);assert.equal(result.nextState.fieldSettings.at(-1).visible,true);
});
test('custom_merge_over_20_is_atomic',()=>{
  const state=fixtureState();for(let i=0;i<20;i++)state.fieldSettings.push({id:`custom_00000000-0000-4000-8000-${String(i+2).padStart(12,'0')}`,kind:'text',label:'合成',visible:false,required:false});
  const snapshot=structuredClone(state), result=plan(state,parse(referenceBackup(fixtureState(1,{custom:true}))));
  assert.equal(result.nextState,null);assert.match(result.error,/20/);assert.deepEqual(state,snapshot);
});
test('shared_url_warns_without_skipping',()=>{
  const state=fixtureState(),record=fixtureRestaurant({name:'別の支店',address:'別の架空市',urls:state.stores[0].urls});
  const legacy=plan(state,parse([{name:record.name,address:record.address,mapsURL:record.urls[0]}]));
  assert.equal(legacy.counts.valid,1);assert.equal(legacy.counts.duplicate,0);assert.equal(legacy.counts.warning,1);assert.equal(legacy.nextState.stores.length,2);
});
test('exact_duplicate_default_skip_and_override',()=>{
  const state=fixtureState(),parsed=parse(referenceBackup(state));
  assert.equal(plan(state,parsed).counts.duplicate,1);assert.equal(plan(state,parsed).nextState,null);
  assert.equal(plan(state,parsed,{includeDuplicates:true}).nextState.stores.length,2);
});
test('same_name_without_address_or_url_is_not_skipped',()=>{
  const r={name:'同名の合成店'}, result=plan(fixtureState(0),parse([r,r]));
  assert.equal(result.counts.valid,2);assert.equal(result.nextState.stores.length,2);
});
test('restore_keeps_zero_and_duplicate_records',()=>{
  const empty=plan(fixtureState(),parse(referenceBackup(fixtureState(0))),{mode:'restore',applySettings:true});assert.equal(empty.nextState.stores.length,0);
  const state=fixtureState(2);Object.assign(state.stores[1],{...state.stores[0],id:'other'});
  const result=plan(fixtureState(),parse(referenceBackup(state)),{mode:'restore',applySettings:true});assert.equal(result.nextState.stores.length,2);
  assert.equal(plan(fixtureState(),parse([{name:'旧JSON'}]),{mode:'restore',applySettings:true}).nextState,null);
});
test('invalid_restore_is_atomic_but_append_skips_invalid_values',()=>{
  const data=referenceBackup(fixtureState(2));data.restaurants[1].name='';const state=fixtureState(), snapshot=structuredClone(state);
  const parsed=parse(data);const restore=plan(state,parsed,{mode:'restore',applySettings:true});assert.equal(restore.nextState,null);assert.match(restore.error,/修正|不正/);
  const appended=plan(state,parsed,{includeDuplicates:true});assert.equal(appended.nextState.stores.length,2);assert.deepEqual(state,snapshot);
});
test('required_missing_warns_and_restores_legacy_values',()=>{
  const state=fixtureState();state.fieldSettings.find(f=>f.id==='phone').required=true;
  const result=plan(state,parse([{name:'電話なし合成店'}]));assert.equal(result.nextState.stores.length,2);assert.equal(result.counts.warning,1);
});
test('unknown_v2_keys_and_custom_ids_reject_whole_file',()=>{
  for(const mutate of [d=>d.extra=true,d=>d.restaurants[0].mapsURL='https://example.invalid/',d=>d.restaurants[0].customValues={constructor:'x'},d=>d.fieldSettings[0].visible=false,d=>d.schemaVersion=3]) {
    const data=referenceBackup(fixtureState());mutate(data);assert.throws(()=>parse(data));
  }
});
test('encoding_file_depth_size_and_extension_limits',()=>{
  const decode=api('decodeImportFile');assert.throws(()=>decode(new Uint8Array([0xff,0xfe]),'x.json'));assert.throws(()=>decode(new Uint8Array([0xc3,0x28]),'x.csv'));
  assert.equal(decode(new TextEncoder().encode('\uFEFFname\n合成店'),'x.csv'),'name\n合成店');
  assert.throws(()=>decode(new Uint8Array(2*1024*1024+1),'x.csv'));assert.throws(()=>decode(new Uint8Array(8*1024*1024+1),'x.json'));
  assert.throws(()=>parse('x','x.zip'));let deep='"x"';for(let i=0;i<17;i++)deep='['+deep+']';assert.throws(()=>parse(deep));
});
test('canonical_byte_boundary_is_atomic_for_import',()=>{
  const full=sizedState(8*1024*1024), snapshot=structuredClone(full);
  const restore=plan(fixtureState(),parse(serializeState(full).json),{mode:'restore',applySettings:true});assert.equal(restore.serialized.bytes,8*1024*1024);
  const incoming=fixtureState();incoming.stores[0].name='追加合成店';
  const result=plan(full,parse(referenceBackup(incoming)));assert.equal(result.nextState,null);assert.ok(result.error);assert.deepEqual(full,snapshot);
});
