import test from 'node:test';
import assert from 'node:assert/strict';
import { fixtureSettings, fixtureRestaurant, fixtureState, sizedState, referenceBackup, nextFixtureId, CUSTOM_ID } from './fixtures.mjs';
const model = await import('../model.js').catch(error => { if (error.code === 'ERR_MODULE_NOT_FOUND') return {}; throw error; });
const api = name => { assert.equal(typeof model[name], 'function', `${name} must be implemented`); return model[name]; };
const normalize = (value,settings=fixtureSettings(),mode='import') => api('normalizeRestaurant')(value,settings,{requiredMode:mode});

test('urls_10_allowed_11_rejected', () => {
  assert.equal(normalize(fixtureRestaurant({urls:Array.from({length:10},(_,i)=>`https://example.invalid/${i}`)})).urls.length,10);
  assert.throws(()=>normalize(fixtureRestaurant({urls:Array.from({length:11},(_,i)=>`https://example.invalid/${i}`)})));
  assert.deepEqual(normalize(fixtureRestaurant({urls:[' ', 'https://example.invalid/a','https://example.invalid/a']})).urls,['https://example.invalid/a']);
});
test('unsafe_url_rejected', () => {
  for(const url of ['javascript:alert(1)','data:text/plain,x','file:///x','/relative','https://u:p@example.invalid/','https://example.invalid/\nx','https://example.invalid/?'+'x'.repeat(2000)]) assert.throws(()=>normalize(fixtureRestaurant({urls:[url]})),url);
  assert.equal(normalize(fixtureRestaurant({urls:['http://example.invalid/?q=x#memo']})).urls[0],'http://example.invalid/?q=x#memo');
});
test('url_errors_identify_the_input_row', () => {
  assert.throws(()=>normalize(fixtureRestaurant({urls:['https://example.invalid/','javascript:alert(1)']})),e=>e.fieldId==='urls'&&e.rowIndex===2);
});
test('settings_lock_name_and_hidden_required', () => {
  for(const changes of [{visible:false},{required:false}]) { const s=fixtureSettings(); Object.assign(s[0],changes); assert.throws(()=>api('validateFieldSettings')(s)); }
  const s=fixtureSettings(); s[1].visible=false;s[1].required=true; assert.throws(()=>api('validateFieldSettings')(s));
  const renamed=fixtureSettings(); renamed[0].label='お気に入り'; assert.equal(api('validateFieldSettings')(renamed)[0].id,'name');
});
test('settings_enforce_ids_types_labels_and_custom_limit', () => {
  const s=fixtureSettings();
  for(let i=0;i<20;i++) s.push({id:`custom_00000000-0000-4000-8000-${String(i).padStart(12,'0')}`,kind:'text',label:'自由項目',visible:true,required:false});
  assert.equal(api('validateFieldSettings')(s).length,27);
  s.push({...s.at(-1),id:'custom_00000000-0000-4000-8000-999999999999'}); assert.throws(()=>api('validateFieldSettings')(s));
  for(const change of [{id:'__proto__'},{kind:'number'},{label:' '},{label:'x'.repeat(41)},{visible:1},{extra:true}]) {const fields=fixtureSettings({custom:true}); Object.assign(fields.at(-1),change);assert.throws(()=>api('validateFieldSettings')(fields));}
  assert.throws(()=>api('validateFieldSettings')([...fixtureSettings(),fixtureSettings()[0]]));
});
test('hidden_edit_preserves_values_and_input_objects', () => {
  const original=fixtureState(1,{hiddenIds:['phone','urls','tags',CUSTOM_ID],custom:true}), snapshot=structuredClone(original);
  const result=api('applyManualDraft')(original,{id:original.stores[0].id,values:{name:'合成店・改名',memo:''}},nextFixtureId);
  for(const key of ['phone','urls','tags','customValues']) assert.deepEqual(result.nextState.stores[0][key],original.stores[0][key]);
  assert.equal(result.nextState.stores[0].memo,'');assert.deepEqual(original,snapshot);
  assert.throws(()=>api('applyManualDraft')(original,{id:original.stores[0].id,values:{phone:''}},nextFixtureId));
  assert.throws(()=>api('applyManualDraft')(original,{id:'missing',values:{name:'店'}},nextFixtureId));
});
test('manual_required_does_not_block_import_or_setting_changes', () => {
  const state=fixtureState();state.stores[0].phone='';const settings=fixtureSettings();settings.find(f=>f.id==='phone').required=true;
  assert.equal(api('applyFieldSettings')(state,settings).nextState.stores[0].phone,'');
  assert.equal(normalize(fixtureRestaurant({phone:''}),settings).phone,'');
  assert.throws(()=>normalize(fixtureRestaurant({phone:''}),settings,'manual'));
});
test('tags_382_can_be_reedited', () => {
  const tags=Array.from({length:12},(_,i)=>String(i).padStart(2,'0')+'x'.repeat(28));
  assert.equal(tags.join(', ').length,382);
  const state=fixtureState(); const result=api('applyManualDraft')(state,{id:state.stores[0].id,values:{tags:tags.join(', ')}},nextFixtureId);
  assert.deepEqual(result.nextState.stores[0].tags,tags);
});
test('canonical_byte_boundary_is_atomic', () => {
  const full=sizedState(8*1024*1024);
  assert.equal(api('serializeState')(full).bytes,8*1024*1024);
  assert.throws(()=>api('serializeState')(sizedState(8*1024*1024+1)),e=>e.code==='CAPACITY_BYTES');
  const snapshot=JSON.stringify(full); const fields=fixtureSettings(); fields[0].label='x'.repeat(40);
  assert.throws(()=>api('applyFieldSettings')(full,fields),e=>e.code==='CAPACITY_BYTES'); assert.equal(JSON.stringify(full),snapshot);
});
test('canonical_v2_retains_all_values_and_measures_real_utf8', () => {
  const state=fixtureState(1,{custom:true});state.stores[0].memo='日本語\n"\\';state.stores[0].customValues[CUSTOM_ID]='二行\n目';
  const result=api('serializeState')(state);
  assert.deepEqual(JSON.parse(result.json),referenceBackup(state)); assert.equal(result.bytes,Buffer.byteLength(result.json));
  assert.equal(result.json,JSON.stringify(referenceBackup(state)));assert.ok(!result.json.includes('fixture-0'));
});
test('canonical_fields_reject_null_instead_of_coercing_to_empty', () => {
  for(const key of ['genre','phone','address','memo','tags','urls','customValues']) assert.throws(()=>normalize(fixtureRestaurant({[key]:null})),`${key} must retain its declared type`);
});
test('reset_fields_keeps_custom_definitions_and_values', () => {
  const state=fixtureState(1,{custom:true});state.fieldSettings.reverse();
  const reset=api('resetFieldSettings')(state.fieldSettings);assert.equal(reset[0].id,'name');assert.equal(reset.at(-1).id,CUSTOM_ID);
  assert.equal(reset.at(-1).visible,false);assert.equal(reset.at(-1).required,false);
  assert.deepEqual(api('applyFieldSettings')(state,reset).nextState.stores[0].customValues,state.stores[0].customValues);
});
test('store_limit_and_custom_lengths_fail_before_mutation', () => {
  const state=fixtureState(2000);assert.throws(()=>api('applyManualDraft')(state,{id:null,values:{name:'追加'}},nextFixtureId),e=>e.code==='STORE_LIMIT');
  assert.throws(()=>api('serializeState')(fixtureState(2001)),e=>e.code==='STORE_LIMIT');
  const settings=fixtureSettings({custom:true}); assert.equal(normalize(fixtureRestaurant({customValues:{[CUSTOM_ID]:'x'.repeat(1000)}}),settings).customValues[CUSTOM_ID].length,1000);
  assert.throws(()=>normalize(fixtureRestaurant({customValues:{[CUSTOM_ID]:'x'.repeat(1001)}}),settings));
  assert.throws(()=>normalize(fixtureRestaurant({customValues:{constructor:'x'}}),settings));
});
