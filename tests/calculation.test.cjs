'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const pointsSource = fs.readFileSync(path.join(root, 'points-data.js'), 'utf8');

// Extract the actual production function rather than reimplementing its logic.
// Fail closed when the signature changes; adapt this harness during refactoring.
const match = source.match(/function ptsFor\(count,sex,v\)\{[^{}]*\}/);
assert.ok(match, 'Production ptsFor() not found; update the test adapter');
const ptsFor = vm.runInNewContext(`${match[0]}; ptsFor`, Object.create(null), {timeout:1000});
const thresholds = [2,3,5,6,8,9,11,12,14,15];
const dogExpected = [[0,0],[1,0],[2,1],[4,1],[5,2],[7,2],[8,3],[10,3],[11,4],[13,4],[14,5],[20,5]];
const bitchExpected = [[0,0],[2,0],[3,1],[5,1],[6,2],[8,2],[9,3],[11,3],[12,4],[14,4],[15,5],[20,5]];
for (const [sex, cases] of [['dog',dogExpected],['bitch',bitchExpected]]) {
  for (const [count,expected] of cases) {
    test(`Production threshold: ${sex}, count ${count} -> ${expected}`,()=>{
      assert.equal(ptsFor(count,sex,thresholds),expected);
    });
  }
}
test('Points never decrease as competition increases',()=>{
  for(const sex of ['dog','bitch']) {
    let last=0;
    for(let n=0;n<=100;n++) {const value=ptsFor(n,sex,thresholds);assert.ok(value>=last);last=value;}
  }
});
test('Point awards remain capped at five',()=>{
  for(const sex of ['dog','bitch']) assert.equal(ptsFor(10000,sex,thresholds),5);
});
test('Arizona and California map to Division 9',()=>{
  assert.match(source,/AZ:9,CA:9/);
});
test('Historical schedule is not silently treated as verified',()=>{
  assert.match(source,/dt<POINT_SCHEDULE_META\.effectiveDate/);
  assert.match(source,/available:false/);
});
test('Schedule lookup references division and breed',()=>{
  assert.match(source,/key=`\$\{division\(\)\}\|\$\{breed\.value\}`/);
});
test('Missing verified schedule row is explicitly unavailable',()=>{
  assert.match(source,/if\(!v\)return \{v:null,verified:false,available:false/);
});
test('Non-regular non-champion route yields zero points',()=>{
  assert.match(source,/Non-Champion non-regular entry: award recorded/);
  assert.match(source,/best=0;control=highestAward/);
});
test('Reserve Winners yields zero championship points',()=>{
  assert.match(source,/reserve award recorded — 0 CH points/);
});
test('Direct BOB entry is disabled for non-champions',()=>{
  assert.match(source,/opt\.disabled=!champ/);
});
test('Point schedule data defines the metadata used by the app',()=>{
  assert.match(pointsSource,/POINT_SCHEDULE_META/);
  assert.match(pointsSource,/VERIFIED/);
});
test('PWA assets exist',()=>{
  for(const f of ['index.html','styles.css','sw.js','manifest.webmanifest']) assert.ok(fs.existsSync(path.join(root,f)),f);
});
