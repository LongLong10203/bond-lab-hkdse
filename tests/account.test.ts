import test,{beforeEach,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import { allowedGoogleProfile, allowedEmail, schoolEmail, schoolDomains, privateAllowedEmails } from '../src/lib/account-policy';

const originalDomains = process.env.AUTH_SCHOOL_DOMAINS;
const originalExceptions = process.env.AUTH_ALLOWED_EMAILS;
beforeEach(()=>{
  process.env.AUTH_SCHOOL_DOMAINS='school.example,academy.example';
  process.env.AUTH_ALLOWED_EMAILS='';
});
afterEach(()=>{
  if(originalDomains===undefined)delete process.env.AUTH_SCHOOL_DOMAINS;else process.env.AUTH_SCHOOL_DOMAINS=originalDomains;
  if(originalExceptions===undefined)delete process.env.AUTH_ALLOWED_EMAILS;else process.env.AUTH_ALLOWED_EMAILS=originalExceptions;
});

test('only exact configured school email domains are accepted',()=>{
  for(const domain of ['school.example','academy.example']){
    for(const email of [`s12345@${domain}`,`Teacher@${domain.toUpperCase()}`])assert.equal(schoolEmail(email),true);
    for(const email of [`a@fake-${domain}`,`a@${domain}.evil.com`,`a@sub.${domain}`,`a@@${domain}`,` a@${domain}`,`@${domain}`])assert.equal(schoolEmail(email),false);
  }
  for(const email of ['s12345@gmail.com',null,undefined])assert.equal(schoolEmail(email),false);
});
test('Google school identity requires verification and a matching hosted-domain claim',()=>{
  for(const domain of ['school.example','academy.example']){
    const profile={email:`s12345@${domain}`,email_verified:true,hd:domain};
    assert.equal(allowedGoogleProfile(profile),true);
    for(const patch of [{email_verified:false},{email_verified:'true'},{hd:undefined},{hd:'gmail.com'},{email:'a@gmail.com'}])assert.equal(allowedGoogleProfile({...profile,...patch}),false);
  }
  assert.equal(allowedGoogleProfile({email:'s12345@academy.example',email_verified:true,hd:'school.example'}),false);
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
  assert.equal(allowedEmail('s12345@academy.example'),true);
});

test('school-domain configuration normalises values and rejects unsafe entries',()=>{
  process.env.AUTH_SCHOOL_DOMAINS=' SCHOOL.EXAMPLE ,school.example,academy.example, ,*.example,https://school.example,@school.example,school.example/path,school.example:443,-bad.example,bad-.example,bad..example,localhost';
  assert.deepEqual(schoolDomains(),['school.example','academy.example']);
  assert.equal(schoolEmail('student@sub.school.example'),false);
});
test('missing or invalid school configuration fails closed without disabling private exceptions',()=>{
  for(const value of [undefined,'',' , *.example, https://school.example']){
    if(value===undefined)delete process.env.AUTH_SCHOOL_DOMAINS;else process.env.AUTH_SCHOOL_DOMAINS=value;
    assert.deepEqual(schoolDomains(),[]);
    assert.equal(allowedEmail('student@school.example'),false);
    assert.equal(allowedGoogleProfile({email:'student@school.example',email_verified:true,hd:'school.example'}),false);
  }
  process.env.AUTH_ALLOWED_EMAILS='approved@example.com';
  assert.equal(allowedGoogleProfile({email:'approved@example.com',email_verified:true}),true);
  assert.equal(allowedGoogleProfile({email:'approved@example.com',email_verified:false}),false);
});
test('changing configuration revokes a previously approved school domain',()=>{
  const profile={email:'student@school.example',email_verified:true,hd:'school.example'};
  assert.equal(allowedGoogleProfile(profile),true);
  process.env.AUTH_SCHOOL_DOMAINS='academy.example';
  assert.equal(allowedGoogleProfile(profile),false);
  assert.equal(allowedEmail(profile.email),false);
});
