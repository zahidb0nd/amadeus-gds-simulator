const routes = [
  { origin: 'JFK', dest: 'LHR', date: '15JUL', name: 'SMITH/JOHN', routeName: 'New York to London' },
  { origin: 'DXB', dest: 'LHR', date: '16JUL', name: 'AHMED/ALI', routeName: 'Dubai to London' },
  { origin: 'HND', dest: 'LAX', date: '17JUL', name: 'SATO/KENJI', routeName: 'Tokyo to Los Angeles' },
  { origin: 'SIN', dest: 'SYD', date: '18JUL', name: 'LIM/CHLOE', routeName: 'Singapore to Sydney' },
  { origin: 'CDG', dest: 'DXB', date: '19JUL', name: 'DUPONT/MARIE', routeName: 'Paris to Dubai' }
];

async function createPNR(route, index) {
  const sessionId = `global-test-${index}-${Date.now()}`;
  const apiUrl = 'https://amadeus-gds-simulator.vercel.app/api/command';
  
  const commands = [
    `AN${route.date}${route.origin}${route.dest}`,
    'SS1Y1', // Sell 1 seat in Y class from line 1
    `NM1${route.name}`,
    'AP+1234567890',
    'TK TL20JUL',
    'ER'
  ];

  console.log(`\n--- Creating PNR for ${route.routeName} (${route.origin}-${route.dest}) ---`);
  
  let pnrLocator = null;
  for (const cmd of commands) {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: cmd, sessionId })
    });
    
    const data = await res.json();
    if (!res.ok || !data.ok) {
      console.log(`[ERROR] Command failed: ${cmd} -> ${data.output}`);
      return;
    }
    console.log(`> ${cmd}`);
    // Just print the first line of output for brevity, except for ER
    if (cmd === 'ER') {
      console.log(data.output);
      const match = data.output.match(/([A-Z0-9]{6}) - OK/);
      if (match) pnrLocator = match[1];
    } else {
      console.log(data.output.split('\n')[0]); 
    }
  }
  
  console.log(`✅ Success! Record Locator: ${pnrLocator}`);
}

async function runTests() {
  for (let i = 0; i < routes.length; i++) {
    await createPNR(routes[i], i);
  }
  console.log('\nAll global PNRs created successfully!');
}

runTests().catch(console.error);
