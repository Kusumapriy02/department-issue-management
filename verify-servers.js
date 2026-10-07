const http = require('http');

console.log('🧪 QUICK SYSTEM VERIFICATION TEST\n');

const tests = [
  { name: 'Backend API Health', url: 'http://localhost:5000/api/auth/login', method: 'POST' },
  { name: 'Frontend Server', url: 'http://localhost:3000', method: 'GET' },
];

let passed = 0;
let failed = 0;

tests.forEach((test, idx) => {
  setTimeout(() => {
    const url = new URL(test.url);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: test.method,
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      console.log(`✅ ${test.name}: ${res.statusCode}`);
      passed++;
    });

    req.on('error', (err) => {
      console.log(`❌ ${test.name}: ${err.message}`);
      failed++;
    });

    req.end();
  }, idx * 500);
});

setTimeout(() => {
  console.log(`\n✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`\nServers: ${passed === 2 ? '🟢 RUNNING' : '🔴 ISSUES'}\n`);
  process.exit(0);
}, 3000);
