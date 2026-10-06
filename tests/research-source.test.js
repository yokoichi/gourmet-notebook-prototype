import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {sourceBytes,fixtureSettings,MAP_URL} from './research-fixtures.mjs';
const m=await import('../research/source.js').catch(e=>{if(e.code==='ERR_MODULE_NOT_FOUND')return {};throw e;});
test('lossless CSV preserves BOM CRLF quoted multiline comments, empty row coordinates and unknown columns',async()=>{
 assert.equal(typeof m.readResearchCsv,'function');
 const s='\ufeffタイトル,メモ,URL,タグ,コメント,__proto__\r\n\r\n"合成,店","私有\r\nメモ",'+MAP_URL+',"a","コメント""保存",literal\r\n  ,,,, ,\r\n';const bytes=new TextEncoder().encode(s);
 const p=await m.readResearchCsv(bytes,'synthetic.csv',fixtureSettings());
 assert.equal(p.source.sha256,createHash('sha256').update(bytes).digest('hex'));assert.deepEqual(Uint8Array.from(Buffer.from(p.source.bytesBase64,'base64')),bytes);
 assert.equal(p.source.emptyRecords[0].csvRecordNumber,2);assert.equal(p.candidates[0].sourceRow.csvRecordNumber,3);assert.equal(p.candidates[0].sourceRow.physicalLineEnd,4);
 assert.equal(p.candidates[0].baseRestaurant.memo,'私有\r\nメモ');assert.equal(p.candidates[0].sourceRow.cellsByColumn.コメント,'コメント"保存');assert.equal(p.candidates[1].status,'invalid');
 const projected=m.projectPublicRow(p.candidates[0].sourceRow,MAP_URL);assert.equal(projected.cellsByColumn.メモ,'');assert.ok(!JSON.stringify(projected).includes('私有'));assert.deepEqual(projected.columns,['タイトル','メモ','URL','タグ','コメント']);
});
test('invalid CSV and encoding fail; malformed rows remain reviewable; limits are exact',async()=>{
 assert.equal(typeof m.readResearchCsv,'function');
 for(const s of ['タイトル,メモ,URL,タグ,コメント,タイトル\n店,,,,,','タイトル,メモ,URL,タグ,コメント\n"bad,,,,','タイトル,メモ,URL,タグ,コメント\n店,x"x,,,'])await assert.rejects(m.readResearchCsv(new TextEncoder().encode(s),'x.csv',fixtureSettings()));
 await assert.rejects(m.readResearchCsv(new Uint8Array([0xff,0xfe]),'x.csv',fixtureSettings()));
 assert.equal((await m.readResearchCsv(sourceBytes('店,少列'),'x.csv',fixtureSettings())).candidates[0].status,'invalid');
 assert.equal((await m.readResearchCsv(sourceBytes('店,行\u2028内,'+MAP_URL+',,原本'),'x.csv',fixtureSettings())).candidates[0].sourceRow.physicalLineEnd,2);
 assert.equal((await m.readResearchCsv(sourceBytes(Array(1000).fill('店,,'+MAP_URL+',,').join('\n')),'x.csv',fixtureSettings())).candidates.length,1000);
 await assert.rejects(m.readResearchCsv(sourceBytes(Array(1001).fill('店,,'+MAP_URL+',,').join('\n')),'x.csv',fixtureSettings()));
 await assert.rejects(m.readResearchCsv(sourceBytes('店,'+'x'.repeat(10001)+',,, '),'x.csv',fixtureSettings()));
});
test('fully empty cells are excluded and column/cell boundaries are enforced',async()=>{
 const p=await m.readResearchCsv(sourceBytes(',,,,\n ,,,,'),'synthetic.csv',fixtureSettings());assert.equal(p.source.emptyRecords.length,1);assert.equal(p.candidates.length,1);assert.equal(p.candidates[0].status,'invalid');
 const headers=['タイトル','メモ','URL','タグ','コメント',...Array.from({length:95},(_,i)=>'unknown'+i)];const row=['店','',MAP_URL,'','',...Array(95).fill('x'.repeat(10000))];assert.equal((await m.readResearchCsv(new TextEncoder().encode(headers.join(',')+'\n'+row.join(',')),'s.csv',fixtureSettings())).source.columns.length,100);
 await assert.rejects(m.readResearchCsv(new TextEncoder().encode([...headers,'extra'].join(',')+'\n'+[...row,''].join(',')),'s.csv',fixtureSettings()));
});
