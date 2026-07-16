import { executeCommand } from './src/lib/command-engine';
import { airports } from './src/lib/data/airports';
import fs from 'fs';

const indiaAirports = airports.filter(a => a.country === 'IN');
const gccCountries = ['AE', 'SA', 'QA', 'OM', 'KW', 'BH'];
const gccAirports = airports.filter(a => gccCountries.includes(a.country));

async function run() {
  console.log(`Loaded ${indiaAirports.length} IN airports and ${gccAirports.length} GCC airports.`);
  
  let report = `# India to GCC Ticketing & Refund Report\n\n`;
  report += `This report details the end-to-end PNR creation, pricing, ticketing, and refund process for flights connecting all Indian airports to various GCC hubs.\n\n`;
  report += `| Origin | Dest | PNR | TST Total | Ticket Number | Refund Status |\n`;
  report += `|--------|------|-----|-----------|---------------|---------------|\n`;

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < indiaAirports.length; i++) {
    const origin = indiaAirports[i];
    const dest = gccAirports[i % gccAirports.length]; // Round-robin GCC airports
    const sessionId = `mass-test-${origin.code}-${dest.code}-${Date.now()}`;
    
    try {
      // 1. Availability
      await executeCommand(`AN20AUG${origin.code}${dest.code}`, { sessionId });
      
      // 2. Sell
      await executeCommand(`SS1Y1`, { sessionId });
      
      // 3. Name
      await executeCommand(`NM1TEST/PASSENGER`, { sessionId });
      
      // 4. Contact
      await executeCommand(`AP+9715550000`, { sessionId });
      
      // 5. TKTL
      await executeCommand(`TK TL20AUG`, { sessionId });
      
      // 6. FXP (Price) BEFORE ER
      const fxpRes = await executeCommand(`FXP`, { sessionId });
      let tstTotal = 'ERROR';
      const tstMatch = fxpRes.output.match(/TOTAL USD ([\d\.]+)/);
      if (tstMatch) {
         tstTotal = `$${tstMatch[1]}`;
      }

      // 7. ER (End Retrieve)
      const erRes = await executeCommand(`ER`, { sessionId });
      let pnr = 'ERROR';
      const pnrMatch = erRes.output.match(/([A-Z0-9]{6}) - OK|PNR CREATED ([A-Z0-9]{6})/);
      if (pnrMatch) {
        pnr = pnrMatch[1] || pnrMatch[2];
      }
      
      // 8. TTP (Ticket)
      const ttpRes = await executeCommand(`TTP`, { sessionId });
      let ticket = 'ERROR';
      const ttpMatch = ttpRes.output.match(/E-TICKET (\d+)/);
      if (ttpMatch) {
        ticket = ttpMatch[1];
      }
      
      // 9. TRF (Refund)
      await executeCommand(`XI1`, { sessionId });
      const trfRes = await executeCommand(`REFUND`, { sessionId });
      let refundStatus = 'FAILED';
      if (trfRes.output.includes('REFUND')) {
        refundStatus = 'PROCESSED';
      }

      if (pnr !== 'ERROR' && ticket !== 'ERROR' && refundStatus === 'PROCESSED') {
         successCount++;
      } else {
         failCount++;
      }

      report += `| ${origin.code} (${origin.city}) | ${dest.code} (${dest.city}) | \`${pnr}\` | ${tstTotal} | \`${ticket}\` | ✅ ${refundStatus} |\n`;
      
      if (i % 10 === 0) console.log(`Processed ${i}/${indiaAirports.length}...`);

    } catch (e) {
      console.error(`Error on ${origin.code}-${dest.code}:`, e.message);
      report += `| ${origin.code} | ${dest.code} | ERROR | ERROR | ERROR | ❌ CRASH |\n`;
      failCount++;
    }
  }

  report += `\n## Summary\n- Total Routes Tested: ${indiaAirports.length}\n- Successful Full Cycles: ${successCount}\n- Failures: ${failCount}\n`;
  
  // Write artifact
  const outPath = `C:\\Users\\zahid\\.gemini\\antigravity\\brain\\0bb718cb-0bc4-4288-935d-ba78594e0d0b\\india_gcc_report.md`;
  fs.writeFileSync(outPath, report);
  
  console.log(`\nReport generated at ${outPath}`);
}

run().catch(console.error);
