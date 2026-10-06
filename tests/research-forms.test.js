import test from 'node:test';import assert from 'node:assert/strict';import {readManualIntent} from '../forms.js';
test('untracked manual form has no fabricated edit intent',()=>assert.deepEqual(readManualIntent({}),{changedFields:[],clearedFields:[]}));
