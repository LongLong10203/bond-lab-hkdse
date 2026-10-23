import test from 'node:test';
import assert from 'node:assert/strict';
import { playerName,displayNameSchema,leaderboardPlayer } from '../src/lib/leaderboard';
test('default leaderboard names do not use emails or Google names',()=>{
  assert.equal(playerName('test-abcdef',null),'Chemist ABCDEF');
  assert.equal(playerName('id','Lab partner'),'Lab partner');
  const player=leaderboardPlayer({userId:'id',displayName:null,xp:100,completed:5},1);
  assert.equal(player.level,2);assert.equal(player.rank,1);assert.equal('email' in player,false);
});
test('display names accept nicknames and reject emails, markup and oversized input',()=>{
  for(const name of ['Carbon Cat','化學同學','O’Brien','Lab_07'])assert(displayNameSchema.safeParse(name).success);
  for(const name of ['x','   ','a@syss.edu.hk','<script>alert(1)</script>','a'.repeat(33)])assert(!displayNameSchema.safeParse(name).success);
});
