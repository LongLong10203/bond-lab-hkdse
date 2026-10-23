import test from 'node:test';
import assert from 'node:assert/strict';
import { allowedGoogleProfile, schoolEmail } from '../src/lib/account-policy';

test('only exact school email domains are accepted',()=>{
  for(const email of ['s12345@syss.edu.hk','Teacher@SYSS.EDU.HK'])assert.equal(schoolEmail(email),true);
  for(const email of ['s12345@gmail.com','a@fake-syss.edu.hk','a@syss.edu.hk.evil.com','a@sub.syss.edu.hk','a@@syss.edu.hk',' a@syss.edu.hk','@syss.edu.hk',null])assert.equal(schoolEmail(email),false);
});
test('Google identity requires a verified school email and school hosted-domain claim',()=>{
  const profile={email:'s12345@syss.edu.hk',email_verified:true,hd:'syss.edu.hk'};
  assert.equal(allowedGoogleProfile(profile),true);
  for(const patch of [{email_verified:false},{email_verified:'true'},{hd:undefined},{hd:'gmail.com'},{email:'a@gmail.com'}])assert.equal(allowedGoogleProfile({...profile,...patch}),false);
});
