import test from 'node:test';
import assert from 'node:assert/strict';
import {LIVE_ORIGIN,LEGACY_ORIGIN,trustedSiteOrigins} from '../src/lib/site-origin';
test('production accepts only known app origins while local development stays separate',()=>{
 assert.deepEqual(trustedSiteOrigins(LIVE_ORIGIN),[LIVE_ORIGIN,LEGACY_ORIGIN]);
 assert.deepEqual(trustedSiteOrigins('http://localhost:3000'),['http://localhost:3000']);
 assert(!trustedSiteOrigins(LIVE_ORIGIN).includes('https://attacker.vercel.app'));
});
