'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { VoteChain } = require('./blockchain');

const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, '..', 'data', 'chain.json');
const OPTIONS = (process.env.OPTIONS || 'Alice,Bob,Carol').split(',').map((s) => s.trim());

function load() {
  try {
    const vc = VoteChain.fromJSON(JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')));
    if (vc.isValid()) return vc;
    console.error('Stored chain is invalid; starting fresh');
  } catch (e) { /* no stored chain */ }
  return new VoteChain(OPTIONS);
}

function createServer(vc, save = () => {}) {
  const send = (res, code, body) => {
    res.writeHead(code, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  };
  return http.createServer((req, res) => {
    const url = req.url.split('?')[0];
    if (req.method === 'GET' && (url === '/' || url === '/index.html')) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      return res.end(fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html')));
    }
    if (req.method === 'GET' && url === '/api/results') {
      return send(res, 200, { options: vc.options, tally: vc.tally(), valid: vc.isValid() });
    }
    if (req.method === 'GET' && url === '/api/chain') return send(res, 200, vc.chain);
    if (req.method === 'POST' && url === '/api/vote') {
      let body = '';
      req.on('data', (c) => { body += c; if (body.length > 1e4) req.destroy(); });
      req.on('end', () => {
        try {
          const { voterId, option } = JSON.parse(body || '{}');
          const block = vc.addVote(voterId, option);
          save(vc);
          send(res, 201, block);
        } catch (e) {
          send(res, 400, { error: e.message });
        }
      });
      return;
    }
    send(res, 404, { error: 'not found' });
  });
}

if (require.main === module) {
  const vc = load();
  const save = (v) => {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(v));
  };
  const port = process.env.PORT || 3000;
  createServer(vc, save).listen(port, () => console.log(`Voting app on http://localhost:${port}`));
}

module.exports = { createServer };
