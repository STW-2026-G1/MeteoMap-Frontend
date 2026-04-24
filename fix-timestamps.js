const fs = require('fs');
const path = require('path');

const files = [
  'src/app/pages/ZoneForumPage.tsx',
  'src/app/components/ReportDetailModal.tsx'
];

files.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  
  const originalLength = content.length;
  content = content.replace(/toLocaleDateString\(\)/g, 'toLocaleString()');
  const newLength = content.length;
  
  fs.writeFileSync(fullPath, content, 'utf8');
  
  console.log(`Updated: ${filePath}`);
  console.log(`  Changed ${originalLength === newLength ? 0 : Math.abs(newLength - originalLength) / 5} occurrences`);
});

console.log('\nAll files updated successfully!');
