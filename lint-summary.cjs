const fs = require('fs');
const path = require('path');
const data = JSON.parse(fs.readFileSync('lint-output.json', 'utf8'));
const rules = new Map();
for (const file of data) {
  const rel = path.relative(process.cwd(), file.filePath).split(path.sep).join('/');
  for (const msg of file.messages) {
    const list = rules.get(msg.ruleId || 'unknown') || [];
    list.push({ file: rel, line: msg.line, message: msg.message });
    rules.set(msg.ruleId || 'unknown', list);
  }
}
function printRule(ruleId, limit = 10) {
  const entries = (rules.get(ruleId) || []).sort((a, b) => a.file.localeCompare(b.file));
  console.log();
  for (const { file, line, message } of entries.slice(0, limit)) {
    console.log();
  }
}
['no-undef', 'no-unused-vars', 'react-refresh/only-export-components', 'react-hooks/exhaustive-deps', 'react-hooks/rules-of-hooks'].forEach((rule) => printRule(rule));
