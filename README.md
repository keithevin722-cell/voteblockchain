# voteblockchain

A voting app where each vote is recorded as a block in a hash-linked, proof-of-work blockchain. No dependencies.

```
npm start      # http://localhost:3000 (env: PORT, OPTIONS="Alice,Bob", DATA_FILE)
npm test
```

API: `POST /api/vote {voterId, option}`, `GET /api/results`, `GET /api/chain`.
One vote per voter ID (stored only as a hash); tampering with any block invalidates the chain.
