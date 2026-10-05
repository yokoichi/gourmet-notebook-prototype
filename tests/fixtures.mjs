export const CUSTOM_ID = 'custom_00000000-0000-4000-8000-000000000001';
export function fixtureSettings({ hiddenIds = [], custom = false } = {}) {
  const labels = [['name','店名'],['genre','ジャンル'],['phone','電話'],['address','住所'],['tags','タグ'],['memo','メモ'],['urls','URL']];
  const fields = labels.map(([id,label]) => ({id,kind:'builtin',label,visible:!hiddenIds.includes(id),required:id==='name'}));
  if (custom) fields.push({id:CUSTOM_ID,kind:'text',label:'食べたいもの',visible:!hiddenIds.includes(CUSTOM_ID),required:false});
  return fields;
}
export function fixtureRestaurant(overrides = {}) {
  return {name:'合成店',genre:'カフェ',phone:'+81 00 0000',address:'架空市',tags:['合成'],memo:'確認用',urls:['https://example.invalid/place'],customValues:{},...overrides};
}
export function fixtureState(count = 1, options = {}) {
  return {fieldSettings:fixtureSettings(options),stores:Array.from({length:count},(_,i)=>({...fixtureRestaurant({name:`合成店${i}`,address:`架空市${i}`,urls:[`https://example.invalid/${i}`],customValues:options.custom?{[CUSTOM_ID]:'タルト'}:{}}),id:`fixture-${i}`,source:'合成',icon:'◌',tone:''}))};
}
export function referenceBackup(state) {
  return {schemaVersion:2,format:'gourmet-notebook-prototype',fieldSettings:state.fieldSettings,restaurants:state.stores.map(r=>({name:r.name,genre:r.genre,phone:r.phone,address:r.address,tags:r.tags,memo:r.memo,urls:r.urls,customValues:Object.fromEntries(state.fieldSettings.filter(f=>f.kind==='text'&&r.customValues[f.id]).map(f=>[f.id,r.customValues[f.id]]))}))};
}
export function sizedState(targetBytes) {
  const state = fixtureState(2000);
  let remaining = targetBytes - Buffer.byteLength(JSON.stringify(referenceBackup(state)));
  if (remaining < 0) throw Error('fixture target too small');
  for (const r of state.stores) {
    for (const [key,limit] of [['memo',2000],['address',500]]) {
      const add = Math.min(remaining,limit-r[key].length); r[key]+='x'.repeat(add); remaining-=add;
    }
    const add = Math.min(remaining,2000-r.urls[0].length); r.urls[0]+='x'.repeat(add); remaining-=add;
    if (!remaining) break;
  }
  if (remaining) throw Error('fixture cannot reach target');
  return state;
}
let id = 0;
export const nextFixtureId = () => `new-fixture-${++id}`;
