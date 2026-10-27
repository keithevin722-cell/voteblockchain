'use strict';
const crypto = require('crypto');

const DIFFICULTY = 3;

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

function hashBlock({ index, timestamp, vote, previousHash, nonce }) {
  return sha256(JSON.stringify([index, timestamp, vote, previousHash, nonce]));
}

function mine(block) {
  const prefix = '0'.repeat(DIFFICULTY);
  block.nonce = 0;
  while (!(block.hash = hashBlock(block)).startsWith(prefix)) block.nonce++;
  return block;
}

class VoteChain {
  constructor(options, chain) {
    this.options = [...options];
    this.chain = chain || [mine({ index: 0, timestamp: Date.now(), vote: null, previousHash: '0' })];
  }

  // Voter IDs are stored only as hashes so the ledger does not expose identities.
  static voterHash(voterId) {
    return sha256(`voter:${String(voterId)}`);
  }

  hasVoted(voterId) {
    const h = VoteChain.voterHash(voterId);
    return this.chain.some((b) => b.vote && b.vote.voter === h);
  }

  addVote(voterId, option) {
    if (typeof voterId !== 'string' || !voterId.trim()) throw new Error('voterId is required');
    if (!this.options.includes(option)) throw new Error('invalid option');
    if (this.hasVoted(voterId)) throw new Error('voter has already voted');
    const prev = this.chain[this.chain.length - 1];
    const block = mine({
      index: prev.index + 1,
      timestamp: Date.now(),
      vote: { voter: VoteChain.voterHash(voterId), option },
      previousHash: prev.hash,
    });
    this.chain.push(block);
    return block;
  }

  tally() {
    const counts = Object.fromEntries(this.options.map((o) => [o, 0]));
    for (const b of this.chain) if (b.vote) counts[b.vote.option]++;
    return counts;
  }

  isValid() {
    const prefix = '0'.repeat(DIFFICULTY);
    const seen = new Set();
    for (let i = 0; i < this.chain.length; i++) {
      const b = this.chain[i];
      if (b.index !== i || b.hash !== hashBlock(b) || !b.hash.startsWith(prefix)) return false;
      if (i > 0) {
        if (b.previousHash !== this.chain[i - 1].hash) return false;
        if (!b.vote || !this.options.includes(b.vote.option) || seen.has(b.vote.voter)) return false;
        seen.add(b.vote.voter);
      }
    }
    return true;
  }

  toJSON() {
    return { options: this.options, chain: this.chain };
  }

  static fromJSON({ options, chain }) {
    return new VoteChain(options, chain);
  }
}

module.exports = { VoteChain, hashBlock, DIFFICULTY };
