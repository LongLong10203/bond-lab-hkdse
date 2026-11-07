import test from 'node:test';
import assert from 'node:assert/strict';
import { allowedGoogleProfile, allowedEmail, schoolEmail, privateAllowedEmails } from '../src/lib/account-policy';

test('only the two exact school email domains are accepted',()=>{
  for(const domain of ['syss.edu.hk','singyin.edu.hk']){
    for(const email of [`s12345@${domain}`,`Teacher@${domain.toUpperCase()}`])assert.equal(schoolEmail(email),true);
    for(const email of [`a@fake-${domain}`,`a@${domain}.evil.com`,`a@sub.${domain}`,`a@@${domain}`,` a@${domain}`,`@${domain}`])assert.equal(schoolEmail(email),false);
  }
  for(const email of ['s12345@gmail.com',null,undefined])assert.equal(schoolEmail(email),false);
});
test('Google school identity requires verification and a matching hosted-domain claim',()=>{
  for(const domain of ['syss.edu.hk','singyin.edu.hk']){
    const profile={email:`s12345@${domain}`,email_verified:true,hd:domain};
    assert.equal(allowedGoogleProfile(profile),true);
    for(const patch of [{email_verified:false},{email_verified:'true'},{hd:undefined},{hd:'gmail.com'},{email:'a@gmail.com'}])assert.equal(allowedGoogleProfile({...profile,...patch}),false);
  }
  assert.equal(allowedGoogleProfile({email:'s12345@singyin.edu.hk',email_verified:true,hd:'syss.edu.hk'}),false);
});
test('private exceptions require an exact verified Google email and can be revoked',t=>{
  const previous=process.env.AUTH_ALLOWED_EMAILS;
  t.after(()=>{if(previous===undefined)delete process.env.AUTH_ALLOWED_EMAILS;else process.env.AUTH_ALLOWED_EMAILS=previous;});
  process.env.AUTH_ALLOWED_EMAILS=' Example.User@gmail.com,example.user@gmail.com, ,invalid, @gmail.com';
  assert.deepEqual(privateAllowedEmails(),['example.user@gmail.com']);
  assert.equal(allowedEmail('EXAMPLE.USER@gmail.com'),true);
  assert.equal(allowedGoogleProfile({email:'example.user@gmail.com',email_verified:true}),true);
  for(const email of ['other@gmail.com','exampleuser@gmail.com','example.user+tag@gmail.com','example.user@gmail.com.evil.com',' example.user@gmail.com']){
    assert.equal(allowedEmail(email),false);
    assert.equal(allowedGoogleProfile({email,email_verified:true}),false);
  }
  for(const email_verified of [false,'true',undefined])assert.equal(allowedGoogleProfile({email:'example.user@gmail.com',email_verified}),false);
  process.env.AUTH_ALLOWED_EMAILS='';
  assert.equal(allowedEmail('example.user@gmail.com'),false);
  assert.equal(allowedGoogleProfile({email:'example.user@gmail.com',email_verified:true}),false);
  assert.equal(allowedEmail('s12345@singyin.edu.hk'),true);
});
