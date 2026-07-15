import fs from 'fs';
import path from 'path';

async function main() {
  const url = 'https://raw.githubusercontent.com/lukes/ISO-3166-Countries-with-Regional-Codes/master/all/all.json';
  console.log('Fetching countries list...');
  const res = await fetch(url);
  const data = await res.json();
  const outputPath = path.join(process.cwd(), 'scripts', 'countries_downloaded.json');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`Saved ${data.length} countries to ${outputPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
