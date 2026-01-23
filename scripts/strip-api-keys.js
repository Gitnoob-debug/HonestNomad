// Strip exposed API keys from POI cache files
const fs = require('fs');
const path = require('path');

const poisDir = path.join(__dirname, '..', 'data', 'pois');
const files = fs.readdirSync(poisDir).filter(f => f.endsWith('.json'));

let totalFixed = 0;

files.forEach(file => {
  const filePath = path.join(poisDir, file);
  const content = fs.readFileSync(filePath, 'utf8');

  // Remove API key from all imageUrls
  // Pattern: &key=AIza... at end of URL
  const fixed = content.replace(/&key=AIza[A-Za-z0-9_-]+/g, '');

  if (fixed !== content) {
    fs.writeFileSync(filePath, fixed);
    const count = (content.match(/&key=AIza/g) || []).length;
    console.log(`${file}: removed ${count} API keys`);
    totalFixed += count;
  } else {
    console.log(`${file}: no API keys found`);
  }
});

console.log(`\nTotal API keys removed: ${totalFixed}`);
