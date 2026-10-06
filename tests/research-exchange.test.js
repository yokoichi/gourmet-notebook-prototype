import test from 'node:test';import assert from 'node:assert/strict';import {fixtureRequested,fixtureExchange,MAP_URL} from './research-fixtures.mjs';
const m=await import('../research/exchange.js').catch(e=>{if(e.code==='ERR_MODULE_NOT_FOUND')return {};throw e;});
test('public exchange validates exact request, copied fields and per-field sources',async()=>{
 assert.equal(typeof m.validateExchange,'function');const {transport,snapshot}=await fixtureRequested();const e=fixtureExchange(transport);const v=await m.validateExchange(e,transport,snapshot.notebook.fieldSettings);assert.equal(v.identityVerified,true);assert.deepEqual(v.eligibleFields,['genre','phone','address']);
 for(const mutate of [x=>x.inputHash='bad',x=>x.urlJobId='other',x=>x.extra=1,x=>x.result.restaurant.memo='private',x=>x.result.fieldEvidence.phone.sourceIds=[],x=>x.result.sourceRow.physicalLineStart++,x=>x.result.sources[0].observedAt='2026-02-30',x=>x.result.errors=['fatal'],x=>x.result.fieldEvidence.address.sourceLineStart=2]){const bad=structuredClone(e);mutate(bad);await assert.rejects(m.validateExchange(bad,transport,snapshot.notebook.fieldSettings));}
 const unknown=fixtureExchange(transport,{phone:''});assert.deepEqual((await m.validateExchange(unknown,transport,snapshot.notebook.fieldSettings)).unknownFields,['phone']);
});
test('map identity uses lossless BigInt direct or encoded IDs and unresolved URLs stay unresolved',()=>{
 assert.equal(typeof m.mapIdentifier,'function');assert.equal(m.mapIdentifier(MAP_URL).cid,BigInt('0xfedcba9876543210').toString());assert.equal(m.mapIdentifier('https://maps.app.goo.gl/example'),null);
 const bytes=Buffer.alloc(20);bytes.set([10,18,9]);bytes.writeBigUInt64LE(0x1234n,3);bytes[11]=17;bytes.writeBigUInt64LE(0xfedcba9876543210n,12);const encoded=bytes.toString('base64url');const url='https://www.google.com/maps/place/?q=place_id:'+encoded;
 assert.deepEqual(m.mapIdentifier(url),m.mapIdentifier(MAP_URL));const identity={status:'matched',method:'encoded_public_map_id',sourceIds:['s'],originalIdentifier:'0x1234:0xfedcba9876543210',publicIdentifier:encoded,explanation:''};assert.equal(m.verifyIdentity(identity,MAP_URL,[{id:'s',url}]),true);
 assert.equal(m.mapIdentifier('https://example.invalid/?cid=123'),null);assert.equal(m.mapIdentifier('https://www.google.com/maps/?cid=18364758544493064720').cid,'18364758544493064720');
});
test('result file rejects duplicate keys, legacy format, null, unknown root and whole oversize; batch isolates schema failures',()=>{
 assert.equal(typeof m.parseResultFile,'function');const enc=s=>new TextEncoder().encode(s);
 for(const s of ['{"a":1,"a":2}','{"format":"old","schemaVersion":1}','{"a":null}',' '.repeat(16*1024*1024+1)])assert.throws(()=>m.parseResultFile(enc(s),'x.json'));
 const parsed=m.parseResultFile(enc('{"format":"gourmet-notebook-ai-result-batch","schemaVersion":1,"exchanges":[{"bad":true}]}'),'x.json');assert.equal(parsed.exchanges.length,1);
});
test('public HTML map IDs may be documented in an official source claim without fetching its page',async()=>{const {transport,snapshot}=await fixtureRequested();const e=fixtureExchange(transport);e.result.sources[0].url='https://example.invalid/official';e.result.sources[0].accessRoute='public_html';e.result.sources[0].claim='公開HTML内の地図識別子 0x1234:0xfedcba9876543210 を観測';assert.equal((await m.validateExchange(e,transport,snapshot.notebook.fieldSettings)).identityVerified,true);e.result.sources[0].claim='施設名だけ一致';assert.equal((await m.validateExchange(e,transport,snapshot.notebook.fieldSettings)).identityVerified,false);});
