 'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

// Execute the actual v4.3.0-R6 confirmation and toggleAward functions.
const app=fs.readFileSync(path.resolve(__dirname,'..','app.js'),'utf8');
function extract(startText,endText){
  const start=app.indexOf(startText),end=app.indexOf(endText,start);
  assert.ok(start>=0&&end>start,`Missing production function: ${startText}`);
  return app.slice(start,end);
}
const source=extract('function confirmOppositeWinners(){','\nfunction updateEntryRouteEligibility()')+'\n'+extract('function toggleAward(a){','\nconst NOHS_PTS=');
function harness({sex='dog',status='class',oppositeAwarded=true}={}){
  const fields={sex:{value:sex},status:{value:status}};
  const confirmations=[];
  const context={
    selectedAwards:new Set(),selectedNOHS:new Set(),oppositeWinnersAwarded:null,
    $:id=>fields[id.slice(1)]||null,
    isGCH:()=>['champion','grandchampion'].includes(fields.status.value),
    renderAwards:()=>{},
    window:{confirm:message=>{confirmations.push(message);return oppositeAwarded}}
  };
  vm.createContext(context);vm.runInContext(source,context,{timeout:1000});
  return {choose:a=>context.toggleAward(a),awards:context.selectedAwards,confirmations,context};
}
for(const sex of ['dog','bitch']){
  const winner=sex==='dog'?'WD':'WB';
  for(const answer of [true,false]){
    for(const award of ['BOB','G1','BIS','RBIS']){
      test(`Class ${sex}: ${award} with opposite-sex Winners ${answer?'awarded':'not awarded'}`,()=>{
        const h=harness({sex,oppositeAwarded:answer});h.choose(award);
        assert.ok(h.awards.has(winner));assert.ok(h.awards.has('BOB'));
        assert.equal(h.awards.has('BOW'),answer);
        assert.equal(h.confirmations.length,1);
        assert.match(h.confirmations[0],sex==='dog'?/Winners Bitch/:/Winners Dog/);
        if(award!=='BOB')assert.ok(h.awards.has(award));
      });
    }
  }
  test(`Class ${sex}: cached answer avoids repeat prompt`,()=>{
    const h=harness({sex,oppositeAwarded:false});h.choose('BOB');h.choose('G1');
    assert.equal(h.confirmations.length,1);assert.ok(!h.awards.has('BOW'));
  });
  test(`Class ${sex}: removing BOB removes dependent Group award`,()=>{
    const h=harness({sex});h.choose('G1');h.choose('BOB');
    assert.ok(!h.awards.has('BOB'));assert.ok(!h.awards.has('G1'));
  });
}
test('Champion BOB never prompts or assigns BOW',()=>{
  const h=harness({status:'champion'});h.choose('BOB');
  assert.ok(h.awards.has('BOB'));assert.ok(!h.awards.has('BOW'));
  assert.equal(h.confirmations.length,0);
});
test('Saved record includes explicit opposite-sex Winners answer',()=>{
  assert.match(app,/awards:\[\.\.\.selectedAwards\],oppositeWinnersAwarded/);
});
test('Editing record restores explicit answer or legacy BOW inference',()=>{
  assert.match(app,/oppositeWinnersAwarded=r\.oppositeWinnersAwarded\?\?\(selectedAwards\.has\('BOW'\)\?true:null\)/);
});
test('Clearing form resets confirmation state',()=>{
  assert.match(app,/function clearForm\(\)[^\n]*oppositeWinnersAwarded=null/);
});
