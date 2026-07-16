import { executeCommand } from './src/lib/command-engine';
import { airports } from './src/lib/data/airports';
import fs from 'fs';

// To avoid a 12-million-row report that would crash the machine, 
// we will randomly sample 500 aggressive global scenarios.
const NUM_SCENARIOS = 500;

function getRandomAirport() {
  return airports[Math.floor(Math.random() * airports.length)];
}

interface EdgeCase {
  type: string;
  action: (sid: string, o: string, d: string) => Promise<any>;
  expected: string;
}

const edgeCases: EdgeCase[] = [
  // 1. AN edge case
  { type: 'INVALID_AN_FORMAT', action: async (sid: string, o: string, d: string) => {
      return await executeCommand(`AN20AUG${o}`, { sessionId: sid }); // Missing destination
  }, expected: 'INVALID FORMAT' },
  
  // 2. SS edge case
  { type: 'INVALID_LINE_SS', action: async (sid: string, o: string, d: string) => {
      await executeCommand(`AN20AUG${o}${d}`, { sessionId: sid });
      return await executeCommand(`SS1Y9`, { sessionId: sid }); // Line 9 doesn't exist
  }, expected: 'NO AVAILABILITY FOR LINE' },
  { type: 'OVERBOOKING', action: async (sid: string, o: string, d: string) => {
      await executeCommand(`AN20AUG${o}${d}`, { sessionId: sid });
      return await executeCommand(`SS99Y1`, { sessionId: sid });
  }, expected: 'NOT ENOUGH Y CLASS AVAILABILITY' },

  // 3. NM edge case
  { type: 'INVALID_NAME_FORMAT', action: async (sid: string, o: string, d: string) => {
      return await executeCommand(`NM1JOHN`, { sessionId: sid }); // Missing slash
  }, expected: 'INVALID FORMAT' },

  // 4. TK edge case
  { type: 'INVALID_TICKETING_ARRANGEMENT', action: async (sid: string, o: string, d: string) => {
      return await executeCommand(`TK OK`, { sessionId: sid }); // Should be TK TL
  }, expected: 'INVALID FORMAT' },

  // 5. ER edge case
  { type: 'MISSING_MANDATORY_ER', action: async (sid: string, o: string, d: string) => {
      await executeCommand(`AN20AUG${o}${d}`, { sessionId: sid });
      await executeCommand(`SS1Y1`, { sessionId: sid });
      await executeCommand(`NM1TEST/PASSENGER`, { sessionId: sid });
      // Skip AP and TK
      return await executeCommand(`ER`, { sessionId: sid });
  }, expected: 'INCOMPLETE PNR - MISSING CONTACT, TK' },

  // 6. FXP edge case
  { type: 'PRICE_WITHOUT_ITINERARY', action: async (sid: string, o: string, d: string) => {
      return await executeCommand(`FXP`, { sessionId: sid });
  }, expected: 'NO ITINERARY TO PRICE' },

  // 7. TTP edge case
  { type: 'TTP_WITHOUT_FXP', action: async (sid: string, o: string, d: string) => {
      await executeCommand(`AN20AUG${o}${d}`, { sessionId: sid });
      await executeCommand(`SS1Y1`, { sessionId: sid });
      await executeCommand(`NM1TEST/PASSENGER`, { sessionId: sid });
      await executeCommand(`AP+9715550000`, { sessionId: sid });
      await executeCommand(`TK TL20AUG`, { sessionId: sid });
      await executeCommand(`ER`, { sessionId: sid });
      return await executeCommand(`TTP`, { sessionId: sid });
  }, expected: 'FXP REQUIRED BEFORE TTP' },

  // 8. XI edge case
  { type: 'CANCEL_NONEXISTENT_SEGMENT', action: async (sid: string, o: string, d: string) => {
      await executeCommand(`AN20AUG${o}${d}`, { sessionId: sid });
      await executeCommand(`SS1Y1`, { sessionId: sid });
      await executeCommand(`NM1TEST/PASSENGER`, { sessionId: sid });
      await executeCommand(`AP+9715550000`, { sessionId: sid });
      await executeCommand(`TK TL20AUG`, { sessionId: sid });
      await executeCommand(`FXP`, { sessionId: sid });
      await executeCommand(`ER`, { sessionId: sid });
      return await executeCommand(`XI9`, { sessionId: sid }); // Line 9 doesn't exist in PNR
  }, expected: 'SEGMENT NOT FOUND' },

  // 9. REFUND edge case
  { type: 'REFUND_WITHOUT_CANCEL', action: async (sid: string, o: string, d: string) => {
      await executeCommand(`AN20AUG${o}${d}`, { sessionId: sid });
      await executeCommand(`SS1Y1`, { sessionId: sid });
      await executeCommand(`NM1TEST/PASSENGER`, { sessionId: sid });
      await executeCommand(`AP+9715550000`, { sessionId: sid });
      await executeCommand(`TK TL20AUG`, { sessionId: sid });
      await executeCommand(`FXP`, { sessionId: sid });
      await executeCommand(`ER`, { sessionId: sid });
      const ttpRes = await executeCommand(`TTP`, { sessionId: sid });
      if(!ttpRes.output.includes('E-TICKET')) return { output: 'FAILED TO TICKET' };
      return await executeCommand(`REFUND`, { sessionId: sid });
  }, expected: 'SEGMENT MUST BE CANCELLED FIRST' },

  // 10. TTV (Void) edge case
  { type: 'VOID_WITHOUT_TICKET', action: async (sid: string, o: string, d: string) => {
      await executeCommand(`AN20AUG${o}${d}`, { sessionId: sid });
      await executeCommand(`SS1Y1`, { sessionId: sid });
      await executeCommand(`NM1TEST/PASSENGER`, { sessionId: sid });
      await executeCommand(`AP+9715550000`, { sessionId: sid });
      await executeCommand(`TK TL20AUG`, { sessionId: sid });
      await executeCommand(`FXP`, { sessionId: sid });
      await executeCommand(`ER`, { sessionId: sid });
      return await executeCommand(`TTV`, { sessionId: sid }); // Haven't issued ticket
  }, expected: 'NO TICKET TO VOID' },

  // 11. RT edge case
  { type: 'RETRIEVE_INVALID_PNR', action: async (sid: string, o: string, d: string) => {
      return await executeCommand(`RT999999`, { sessionId: sid });
  }, expected: 'PNR NOT FOUND' }
];

async function run() {
  console.log(`Starting Global Stress Test with ${NUM_SCENARIOS} combinations and edge cases...`);
  
  let report = `# Global GDS Stress Test & Edge Case Report\n\n`;
  report += `This report details an automated stress test sampling global routes and simulating real-world agent edge cases (overbooking, forgotten elements, missing pricing).\n\n`;
  report += `| Scenario Type | Origin | Dest | Result | Edge Case Handled? |\n`;
  report += `|---------------|--------|------|--------|--------------------|\n`;

  let successCount = 0;
  let edgeCaseSuccess = 0;

  for (let i = 0; i < NUM_SCENARIOS; i++) {
    const origin = getRandomAirport();
    const dest = getRandomAirport();
    if (origin.code === dest.code) continue; // Skip same airport

    const sessionId = `stress-${i}-${Date.now()}`;
    
    // 20% chance to run an edge case, 80% chance to run a full successful flow
    if (Math.random() < 0.2) {
       const edgeCase = edgeCases[Math.floor(Math.random() * edgeCases.length)];
       const res = await edgeCase.action(sessionId, origin.code, dest.code);
       const handled = res.output && res.output.includes(edgeCase.expected) ? '✅ YES' : '❌ NO';
       if (handled === '✅ YES') edgeCaseSuccess++;
       
       report += `| ⚠️ EDGE: ${edgeCase.type} | ${origin.code} | ${dest.code} | \`${res.output.replace(/\n/g, ' ')}\` | ${handled} |\n`;
    } else {
       // Full Success Flow
       await executeCommand(`AN20AUG${origin.code}${dest.code}`, { sessionId });
       await executeCommand(`SS1Y1`, { sessionId });
       await executeCommand(`NM1TEST/PASSENGER`, { sessionId });
       await executeCommand(`AP+9715550000`, { sessionId });
       await executeCommand(`TK TL20AUG`, { sessionId });
       await executeCommand(`FXP`, { sessionId });
       const erRes = await executeCommand(`ER`, { sessionId });
       const ttpRes = await executeCommand(`TTP`, { sessionId });
       await executeCommand(`XI1`, { sessionId });
       const trfRes = await executeCommand(`REFUND`, { sessionId });

       let pnrMatch = erRes.output.match(/PNR CREATED ([A-Z0-9]{6})/);
       let ticketMatch = ttpRes.output.match(/E-TICKET (\d+)/);
       
       if (pnrMatch && ticketMatch && trfRes.output.includes('REFUND')) {
          successCount++;
          report += `| 🟢 FULL LIFECYCLE | ${origin.code} | ${dest.code} | PNR: \`${pnrMatch[1]}\`, TKT: \`${ticketMatch[1]}\` | N/A |\n`;
       } else {
          report += `| 🔴 LIFECYCLE FAILED | ${origin.code} | ${dest.code} | ERROR | N/A |\n`;
       }
    }
    
    if (i % 50 === 0) console.log(`Processed ${i}/${NUM_SCENARIOS}...`);
  }

  report += `\n## Summary\n- Total Scenarios: ${NUM_SCENARIOS}\n- Successful Standard Lifecycles: ${successCount}\n- Edge Cases Handled Successfully: ${edgeCaseSuccess}\n`;
  
  const outPath = `C:\\Users\\zahid\\.gemini\\antigravity\\brain\\0bb718cb-0bc4-4288-935d-ba78594e0d0b\\global_stress_test_report.md`;
  fs.writeFileSync(outPath, report);
  
  console.log(`\nReport generated at ${outPath}`);
}

run().catch(console.error);
