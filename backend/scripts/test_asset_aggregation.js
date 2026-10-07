const http = require('http');

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost', port: 5000, path, method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) options.headers.Authorization = 'Bearer ' + token;
    const r = http.request(options, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ s: res.statusCode, b: JSON.parse(d) }));
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

async function run() {
  // Login
  const login = await req('POST', '/api/auth/login', { email: 'admin@college.edu', password: 'admin123' });
  const t = login.b.token;
  console.log('1. Login:', login.s === 200 ? 'OK' : 'FAIL');

  // Baseline
  const b = await req('GET', '/api/assets', null, t);
  const bench = b.b.data.find(a => a.type === 'Bench' && a.room === 'A01');
  const bd = bench.damaged;
  console.log('2. Baseline damaged:', bd);

  // Issue 1 (qty=2)
  const i1 = await req('POST', '/api/issues', {
    title: 'Test bench 1', description: 'Test accumulation issue 1',
    category: 'asset', priority: 'high', assetType: 'Bench',
    block: 'Algorithm', room: 'A01', quantity: 2, issueType: 'damaged',
  }, t);
  console.log('3. Issue 1:', i1.b.success ? 'OK' : i1.b.message);
  const id1 = i1.b.data._id;

  // Check after issue 1
  const a1 = await req('GET', '/api/assets', null, t);
  const d1 = a1.b.data.find(a => a.type === 'Bench' && a.room === 'A01').damaged;
  console.log('4. After issue 1: damaged=' + d1, 'expected=' + (bd+2), d1 === bd+2 ? 'PASS' : 'FAIL');

  // Issue 2 (qty=1)
  const i2 = await req('POST', '/api/issues', {
    title: 'Test bench 2', description: 'Test accumulation issue 2',
    category: 'asset', priority: 'normal', assetType: 'Bench',
    block: 'Algorithm', room: 'A01', quantity: 1, issueType: 'damaged',
  }, t);
  console.log('5. Issue 2:', i2.b.success ? 'OK' : i2.b.message);
  const id2 = i2.b.data._id;

  // Check accumulation
  const a2 = await req('GET', '/api/assets', null, t);
  const d2 = a2.b.data.find(a => a.type === 'Bench' && a.room === 'A01').damaged;
  console.log('6. After issue 2: damaged=' + d2, 'expected=' + (bd+3), d2 === bd+3 ? 'PASS' : 'FAIL');

  // Resolve issue 1
  const r1 = await req('PATCH', '/api/issues/' + id1 + '/status', { status: 'resolved' }, t);
  console.log('7. Resolve issue 1:', r1.b.success ? 'OK' : r1.b.message);

  // Check after resolve
  const a3 = await req('GET', '/api/assets', null, t);
  const d3 = a3.b.data.find(a => a.type === 'Bench' && a.room === 'A01').damaged;
  console.log('8. After resolve: damaged=' + d3, 'expected=' + (bd+1), d3 === bd+1 ? 'PASS' : 'FAIL');

  // Cleanup
  await req('PATCH', '/api/issues/' + id2 + '/status', { status: 'resolved' }, t);
  const a4 = await req('GET', '/api/assets', null, t);
  const d4 = a4.b.data.find(a => a.type === 'Bench' && a.room === 'A01').damaged;
  console.log('9. Cleanup: damaged=' + d4, 'expected=' + bd, d4 === bd ? 'PASS' : 'FAIL');

  console.log('DONE');
}

run().catch(e => console.error('ERR:', e.message));
