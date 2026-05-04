const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walk(dirPath, callback);
    } else {
      callback(path.join(dir, f));
    }
  });
}

const colorRegex1 = /\b(blue|indigo)-(\d{2,3}(?:\/\d{2,3})?)\b/g;
const colorRegex2 = /\b(cyan|sky)-(\d{2,3}(?:\/\d{2,3})?)\b/g;

let changedFiles = 0;

walk(srcDir, (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    content = content.replace(colorRegex1, 'primary-$2');
    content = content.replace(colorRegex2, 'secondary-$2');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
      changedFiles++;
    }
  }
});

console.log(`Replaced colors in ${changedFiles} files.`);
