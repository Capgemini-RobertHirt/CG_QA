const endpoints = {
  'health': require('./health/index.js'),
  'templates-list': require('./templates-list/index.js'),
  'templates-get': require('./templates-get/index.js'),
  'templates-available-types': require('./templates-available-types/index.js'),
  'templates-create': require('./templates-create/index.js'),
  'ideas': require('./ideas/index.js'),
  'analyze': require('./analyze/index.js'),
  'samples-list': require('./samples-list/index.js'),
  'admin-load-templates': require('./admin-load-templates/index.js'),
};

async function testWithDetails() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           API ENDPOINT COMPREHENSIVE TEST REPORT           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const results = [];
  
  for (const [name, handler] of Object.entries(endpoints)) {
    try {
      const context = {
        res: null,
        log: () => {},
        bindingData: name === 'templates-get' ? {entityType: 'default'} : {}
      };
      const req = {body: {}, params: {}};
      
      await handler(context, req);
      
      if (!context.res) {
        results.push({name, status: 'FAIL', code: 'no-response', details: 'No response object'});
        continue;
      }
      
      const status = context.res.status || 200;
      const body = typeof context.res.body === 'string' ? JSON.parse(context.res.body) : context.res.body;
      
      if (status >= 200 && status < 300) {
        results.push({
          name, 
          status: 'PASS', 
          code: status,
          details: `Returns valid JSON with ${Object.keys(body || {}).length} fields`
        });
      } else {
        results.push({
          name, 
          status: 'FAIL', 
          code: status,
          details: body?.error || body?.message || 'Unknown error'
        });
      }
    } catch (error) {
      results.push({
        name, 
        status: 'ERROR', 
        code: error.code || 'exception',
        details: error.message.substring(0, 50)
      });
    }
  }
  
  // Print results
  console.log('STATUS    | NAME                          | CODE | DETAILS');
  console.log('──────────┼────────────────────────────────┼──────┼─────────────────────────────────');
  
  results.forEach(r => {
    const icon = r.status === 'PASS' ? '[OK]' : '[XX]';
    const name = (r.name + ' '.repeat(30)).substring(0, 30);
    const code = (r.code + '').padStart(4);
    console.log(`${icon} ${r.status.padEnd(6)} | ${name} | ${code} | ${r.details}`);
  });
  
  console.log('\n');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status !== 'PASS').length;
  console.log(`Summary: ${passed} PASSED, ${failed} FAILED out of ${results.length} endpoints\n`);
  
  // Detailed pass info
  console.log('WORKING ENDPOINTS:\n');
  results.filter(r => r.status === 'PASS').forEach(r => {
    console.log(`  [PASS] ${r.name} → HTTP ${r.code}`);
  });
  
  console.log('\nFAILED ENDPOINTS:\n');
  results.filter(r => r.status !== 'PASS').forEach(r => {
    console.log(`  [${r.status}] ${r.name} → ${r.details}`);
  });
  
  console.log('\n');
}

testWithDetails();
