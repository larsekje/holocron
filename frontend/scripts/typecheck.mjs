#!/usr/bin/env node
// tsc against a recorded baseline. The codebase carries pre-existing type
// errors (xstate .d.ts parse noise, a few loose components), so plain
// `tsc` / `npm run build` always fails. This fails only on errors that are
// NOT in typecheck-baseline.txt — i.e. the ones your change introduced.
//
//   npm run typecheck            # check
//   npm run typecheck -- --update  # re-record after fixing old errors
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baselineFile = path.join(root, 'typecheck-baseline.txt');

let out = '';
try {
  out = execSync('npx tsc --noEmit -p .', { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
} catch (e) {
  out = (e.stdout ?? '') + (e.stderr ?? '');
}
const raw = out.split('\n').filter((l) => l.includes('error TS'));
// Line/column numbers shift with every edit — compare on file + message.
const key = (l) => l.replace(/\(\d+,\d+\)/, '').trim();

if (process.argv.includes('--update')) {
  writeFileSync(baselineFile, [...new Set(raw.map(key))].sort().join('\n') + '\n');
  console.log(`typecheck: baseline recorded (${raw.length} errors)`);
  process.exit(0);
}

const baseline = new Set(
  existsSync(baselineFile) ? readFileSync(baselineFile, 'utf8').split('\n').filter(Boolean) : [],
);
const fresh = raw.filter((l) => !baseline.has(key(l)));
if (fresh.length === 0) {
  const fixed = [...baseline].filter((b) => !raw.some((l) => key(l) === b)).length;
  console.log(`typecheck: no new errors (${raw.length} baseline${fixed ? `, ${fixed} fixed — run with --update` : ''})`);
  process.exit(0);
}
console.error(`typecheck: ${fresh.length} new error(s):\n` + fresh.join('\n'));
process.exit(1);
