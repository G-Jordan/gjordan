// scripts/extract-inline-js.mjs
// Extract inline *JavaScript* (classic or module) <script> blocks into js/index/inline-XXX.js
// Skips: <script src=...>, <script type="application/ld+json">, <script type="importmap">, etc.
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const INPUT = process.argv[2] || 'index.html';
const OUT_DIR = 'js/index';

function pad(n, w = 3) { return String(n).padStart(w, '0'); }

// Read source HTML
const html = fs.readFileSync(INPUT, 'utf8');

// Regex: <script ...> ... </script>
const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;

// Helpers to parse attributes safely
function getAttr(attrs, name) {
  const m = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(attrs || '');
  if (!m) return null;
  return m[2] ?? m[3] ?? m[4] ?? null;
}
function hasSrc(attrs) {
  return /\bsrc\s*=/.test(attrs || '');
}
function isJsType(attrs) {
  // Empty type => classic JS
  const t = (getAttr(attrs, 'type') || '').trim().toLowerCase();
  if (!t) return true;
  // Treat as JavaScript only if classic or module
  return t === 'text/javascript' || t === 'application/javascript' || t === 'module';
}

// Walk and extract
let outHTML = '';
let lastIndex = 0;
let count = 0;

for (let m; (m = re.exec(html)); ) {
  const [full, rawAttrs, body] = m;
  const attrs = rawAttrs || '';

  // Skip if already external, or not JavaScript type (e.g., JSON-LD / importmap)
  if (hasSrc(attrs) || !isJsType(attrs)) continue;

  count += 1;
  const filename = `inline-${pad(count)}.js`;
  const jsPath   = path.join(path.dirname(INPUT), OUT_DIR, filename);

  // Ensure output dir exists
  fs.mkdirSync(path.join(path.dirname(INPUT), OUT_DIR), { recursive: true });

  // Write JS body exactly as-is
  fs.writeFileSync(jsPath, body, 'utf8');

  // Build replacement <script> tag preserving original attributes + new src
  const needsSpace = attrs.trim().length ? '' : ' ';
  const replacement = `<script${attrs}${needsSpace}src="${OUT_DIR}/${filename}"></script>`;

  outHTML += html.slice(lastIndex, m.index) + replacement;
  lastIndex = m.index + full.length;
}

// If nothing extracted, do nothing
if (count === 0) {
  console.log('No inline JavaScript <script> blocks found to extract.');
  process.exit(0);
}

// Append tail and write outputs (backup + out)
outHTML += html.slice(lastIndex);

const backupPath = INPUT.replace(/(\.html?)$/i, '.backup.$1');
const outPath    = INPUT.replace(/(\.html?)$/i, '.out.$1');

fs.writeFileSync(backupPath, html, 'utf8');
fs.writeFileSync(outPath, outHTML, 'utf8');

console.log(`Extracted ${count} inline script(s).`);
console.log(`- Wrote JS files to: ${OUT_DIR}/inline-XXX.js`);
console.log(`- Backup saved to:   ${backupPath}`);
console.log(`- New HTML saved to: ${outPath}`);
