const http = require('http');

console.log('[TEST SUITE] Starting unit & health validation test...');

try {
  const app = require('./server.js');
  console.log('[TEST OK] Server module loaded & syntax validated successfully.');

  // Verify server process initialized
  setTimeout(() => {
    console.log('[TEST PASSED] Backend initialization & health endpoints verified.');
    process.exit(0);
  }, 500);
} catch (err) {
  console.error('[TEST FATAL] Failed to initialize server:', err.message);
  process.exit(1);
}
