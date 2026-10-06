import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const m=await import('../research/common.js').catch(e=>{if(e.code==='ERR_MODULE_NOT_FOUND')return {};throw e;});
test('strict JSON rejects duplicate decoded keys, null, nonfinite, depth and oversized input',()=>{
 assert.equal(typeof m.parseStrictJson,'function');
 for(const s of ['{"a":1,"\\u0061":2}','{"x":{"a":1,"a":2}}','{"a":null}','{"n":1e309}'])assert.throws(()=>m.parseStrictJson(s,{maxBytes:1000}));
 assert.throws(()=>m.parseStrictJson('['.repeat(17)+'1'+']'.repeat(17),{maxBytes:1000}));
 assert.throws(()=>m.parseStrictJson('"é"',{maxBytes:3}));
 assert.deepEqual(m.parseStrictJson('{"__proto__":1}',{maxBytes:100}),JSON.parse('{"__proto__":1}'));
});
test('canonical hash sorts keys without normalizing arrays, Unicode or line endings',async()=>{
 assert.equal(typeof m.hashValue,'function');
 const v={z:['é','e\u0301'],a:'\r\n'};
 assert.equal(await m.hashValue(v),createHash('sha256').update('{"a":"\\r\\n","z":["é","é"]}').digest('hex'));
 assert.notEqual(await m.hashValue(v),await m.hashValue({...v,a:'\n'}));
 assert.throws(()=>m.canonicalJson({x:undefined}));
});
test('public URLs reject credentials and controls before trimming; retain query and fragment',()=>{
 assert.equal(typeof m.assertPublicUrl,'function');
 for(const u of ['https://a:b@example.invalid','javascript:x','\nhttps://example.invalid','https://example.invalid/\u007f'])assert.throws(()=>m.assertPublicUrl(u));
 assert.equal(m.assertPublicUrl(' https://example.invalid/?q=a#b '),'https://example.invalid/?q=a#b');
 assert.throws(()=>m.assertExactKeys({a:1,b:2},['a']));
});
