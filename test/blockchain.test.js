'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { VoteChain } = require('../src/blockchain');

test('records and tallies votes', () => {
  const vc = new VoteChain(['A', 'B']);
  vc.addVote('u1', 'A');
  vc.addVote('u2', 'A');
  vc.addVote('u3', 'B');
  assert.deepStrictEqual(vc.tally(), { A: 2, B: 1 });
  assert.ok(vc.isValid());
});

test('rejects double votes and invalid options', () => {
  const vc = new VoteChain(['A', 'B']);
  vc.addVote('u1', 'A');
  assert.throws(() => vc.addVote('u1', 'B'), /already voted/);
  assert.throws(() => vc.addVote('u2', 'Z'), /invalid option/);
  assert.throws(() => vc.addVote('', 'A'), /required/);
});

test('detects tampering', () => {
  const vc = new VoteChain(['A', 'B']);
  vc.addVote('u1', 'A');
  vc.chain[1].vote.option = 'B';
  assert.strictEqual(vc.isValid(), false);
});

test('round-trips through JSON', () => {
  const vc = new VoteChain(['A']);
  vc.addVote('u1', 'A');
  assert.ok(VoteChain.fromJSON(JSON.parse(JSON.stringify(vc))).isValid());
});
