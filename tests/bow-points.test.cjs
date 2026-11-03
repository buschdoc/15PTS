
'use strict';
// Additive tests of the production ptsFor() function.
// These do not test automatic BOB/BOW award assignment.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const app = fs.readFileSync(
  path.resolve(__dirname, '..', 'app.js'),
  'utf8'
);

const match = app.match(/function ptsFor\(count,sex,v\)\{[^{}]*\}/);
assert.ok(match, 'Production ptsFor() not found; update adapter before running');

const ptsFor = vm.runInNewContext(
  `${match[0]}; ptsFor`,
  Object.create(null),
  { timeout: 1000 }
);

// Fictional thresholds, not a published AKC schedule.
const thresholds = [2,3,5,6,8,9,11,12,14,15];

const scenarios = [
  ['dog lower than bitch', 'dog', 2, 9, 1, 3, 3],
  ['dog higher than bitch', 'dog', 11, 3, 4, 1, 4],
  ['dog tied with bitch', 'dog', 8, 9, 3, 3, 3],
  ['bitch lower than dog', 'bitch', 11, 14, 4, 3, 4],
  ['bitch higher than dog', 'bitch', 3, 12, 1, 4, 4],
  ['bitch tied with dog', 'bitch', 5, 6, 2, 2, 2],
  ['both reach five', 'dog', 14, 15, 5, 5, 5],
  ['opposite sex five', 'dog', 2, 15, 1, 5, 5],
  ['same sex five', 'bitch', 14, 3, 5, 1, 5],
  ['no same sex competition', 'dog', 1, 9, 0, 3, 3],
  ['no opposite sex competition', 'dog', 8, 0, 3, 0, 3],
  ['neither side has points', 'bitch', 1, 1, 0, 0, 0]
];

for (const [
  name, winnerSex, dogCount, bitchCount,
  dogPoints, bitchPoints, higher
] of scenarios) {
  test(`BOW threshold fixture: ${name}`, () => {
    const wd = ptsFor(dogCount, 'dog', thresholds);
    const wb = ptsFor(bitchCount, 'bitch', thresholds);

    assert.equal(wd, dogPoints, 'WD threshold');
    assert.equal(wb, bitchPoints, 'WB threshold');
    assert.equal(
      Math.max(wd, wb),
      higher,
      'higher potential BOW point value'
    );
    assert.ok(['dog', 'bitch'].includes(winnerSex));
  });
}

for (const winnerSex of ['dog', 'bitch']) {
  test(`BOW threshold invariant: ${winnerSex} never loses points`, () => {
    for (let dogs = 0; dogs <= 20; dogs++) {
      for (let bitches = 0; bitches <= 20; bitches++) {
        const wd = ptsFor(dogs, 'dog', thresholds);
        const wb = ptsFor(bitches, 'bitch', thresholds);
        const own = winnerSex === 'dog' ? wd : wb;

        assert.ok(Math.max(wd, wb) >= own);
      }
    }
  });

  test(`BOW threshold invariant: ${winnerSex} remains capped at five`, () => {
    for (let dogs = 0; dogs <= 20; dogs++) {
      for (let bitches = 0; bitches <= 20; bitches++) {
        assert.ok(
          Math.max(
            ptsFor(dogs, 'dog', thresholds),
            ptsFor(bitches, 'bitch', thresholds)
          ) <= 5
        );
      }
    }
  });
}
