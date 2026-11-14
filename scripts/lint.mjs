import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TARGET_DIRS = ['src'];
const TARGET_FILES = ['App.tsx', 'index.ts'];

function collectFiles(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(full, acc);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

const files = [
  ...TARGET_FILES.map((f) => path.join(ROOT, f)).filter((f) => fs.existsSync(f)),
  ...TARGET_DIRS.flatMap((d) => collectFiles(path.join(ROOT, d))),
];

let errors = 0;

for (const file of files) {
  const rel = path.relative(ROOT, file);
  const content = fs.readFileSync(file, 'utf8');

  if (/^(<{7}|={7}|>{7})/m.test(content)) {
    console.error(`[LINT ERROR] ${rel}: Contains unresolved git merge markers.`);
    errors++;
  }

  if (/\bdebugger\s*;/.test(content)) {
    console.error(`[LINT ERROR] ${rel}: Contains debugger statement.`);
    errors++;
  }

  // SRS BT-03 / AT-11 check: UI must not claim exact Reel counts or "on Instagram Reels" as a usage metric
  if (!rel.includes('__tests__') && /on Instagram Reels/i.test(content)) {
    console.error(
      `[LINT ERROR] ${rel}: Contains prohibited 'on Instagram Reels' usage metric label (must be estimated Instagram foreground time).`
    );
    errors++;
  }
}

if (errors > 0) {
  console.error(`Lint failed with ${errors} error(s).`);
  process.exit(1);
}

console.log(`Lint passed across ${files.length} TypeScript/React Native files.`);
