const fs = require('fs');
const path = require('path');
function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) {
      walk(dirPath);
    } else if (dirPath.endsWith('.tsx')) {
      let c = fs.readFileSync(dirPath, 'utf8');
      if (c.includes('SafeAreaView')) {
        c = c.replace(/SafeAreaView,\s?/g, '').replace(/,\s*SafeAreaView/g, '');
        let lines = c.split('\n');
        let lastImport = 0;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('import ')) {
            lastImport = i;
          }
        }
        lines.splice(lastImport + 1, 0, "import { SafeAreaView } from 'react-native-safe-area-context';");
        fs.writeFileSync(dirPath, lines.join('\n'));
      }
    }
  });
}
walk('c:/Users/dszel/source/repos/BOOKSI_MOBILE_BIZNES/src/screens');
