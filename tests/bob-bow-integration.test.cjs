'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Executes the actual production toggleAward() function, not a rewritten model.
const app = fs.readFileSync(path.resolve(__dirname, '..', 'app.js'), 'utf8');
const start = app.indexOf('function toggleAward(a){');
const end = app.indexOf('\nconst NOHS_PTS=', start);
assert.ok(start >= 0 && end > start, 'Could not isolate production toggleAward()');
const source = app.slice(start, end);

function harness({sex='dog', status='class', classDogs=3, classBitches=3}={}) {
  const fields = {sex:{value:sex},status:{value:status},classDogs:{value:String(classDogs)},classBitches:{value:String(classBitches)}};
  const context = {
    selectedAwards:new Set(), selectedNOHS:new Set(),
    $: id => fields[id.slice(1)] || null,
    isGCH: () => ['champion','grandchampion'].includes(fields.status.value),
    renderAwards: () => {},
  };
  vm.createContext(context);
  vm.runInContext(source,context,{timeout:1000});
  return {choose: award => context.toggleAward(award), awards:context.selectedAwards, fields, context};
}

for (const sex of ['dog','bitch']) {
  test(`Class ${sex}: BOB assigns Winners and BOW when both Winners exist`, () => {
    const h=harness({sex,classDogs:3,classBitches:3});
    h.choose('BOB');
    assert.ok(h.awards.has(sex==='dog'?'WD':'WB'));
    assert.ok(h.awards.has('BOB'));
    assert.ok(h.awards.has('BOW'));
  });
  test(`Class ${sex}: BOB must not assign BOW when opposite-sex Winners is absent`, () => {
    const h=harness({sex,classDogs:sex==='dog'?3:0,classBitches:sex==='bitch'?3:0});
    h.choose('BOB');
    assert.ok(h.awards.has('BOB'));
    assert.ok(!h.awards.has('BOW'), 'BUG: production toggleAward automatically adds BOW despite no opposite-sex class entries');
  });
  test(`Class ${sex}: Group placement must not imply BOW with no opposite-sex Winners`, () => {
    const h=harness({sex,classDogs:sex==='dog'?3:0,classBitches:sex==='bitch'?3:0});
    h.choose('G1');
    assert.ok(h.awards.has('BOB'));
    assert.ok(!h.awards.has('BOW'), 'BUG: Group path automatically adds BOW despite no opposite-sex class entries');
  });
}

test('Champion BOB must not assign BOW',()=>{
  const h=harness({status:'champion'});
  h.choose('BOB');
  assert.ok(h.awards.has('BOB'));
  assert.ok(!h.awards.has('BOW'));
  assert.ok(!h.awards.has('WD'));
  assert.ok(!h.awards.has('WB'));
});

test('Removing class BOB removes dependent Group awards',()=>{
  const h=harness();
  h.choose('G1');
  h.choose('BOB');
  assert.ok(!h.awards.has('BOB'));
  assert.ok(!h.awards.has('G1'));
});
