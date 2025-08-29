// scripts/titleify-inline-js.mjs (safe)
// Rename js/index/inline-XXX.js -> <title>.js where <title> is the HTML comment
// IMMEDIATELY above the script tag (only whitespace allowed in between).
//
// Usage: node scripts/titleify-inline-js.mjs /path/to/index.html

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const INPUT = process.argv[2];
if (!INPUT) {
  console.error('Usage: node scripts/titleify-inline-js.mjs /path/to/index.html');
  process.exit(1);
}

const MAX_BASENAME = 60; // keep filenames short (avoid ENAMETOOLONG)
const htmlPath = path.resolve(INPUT);
const projectDir = path.dirname(htmlPath);
const html = fs.readFileSync(htmlPath, 'utf8');

// Find all <script ... src="js/index/inline-###.js" ...></script>
const scriptRe = /<script\b([^>]*?)\bsrc\s*=\s*"(?:(?:\.\/)?)(js\/index\/inline-(\d+)\.js)"([^>]*)>\s*<\/script>/gim;

/** slugify to safe filename (short & unique later) */
function slugify(s) {
  if (!s) return null;
  // basic cleanups
  s = s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  s = s.replace(/&/g, ' and ');
  s = s.replace(/[→←↔]/g, ' ');
  s = s.replace(/[\/\\]+/g, ' ');
  s = s.replace(/[<>\[\]]/g, ' ');
  s = s.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
  if (!s) return null;
  if (s.length > MAX_BASENAME) s = s.slice(0, MAX_BASENAME).replace(/-+$/,'');
  return s;
}

/** find the closest HTML comment *immediately* above `idx` */
function findImmediateCommentAbove(src, idx) {
  // Only look in a small window above to be extra safe (e.g., 2KB)
  const WINDOW = 2048;
  const start = Math.max(0, idx - WINDOW);
  const before = src.slice(start, idx);
  // Walk backwards to the last "-->" then pair with the matching "<!--"
  let end = before.lastIndexOf('-->');
  while (end !== -1) {
    const commentEndAbs = start + end + 3;
    const open = before.lastIndexOf('<!--', end);
    if (open === -1) break;
    const commentStartAbs = start + open;
    const commentBody = src.slice(commentStartAbs + 4, start + end).trim();
    const between = src.slice(commentEndAbs, idx);
    // Only whitespace allowed between comment and script
    if (between.trim() === '') {
      return commentBody;
    }
    // try the previous comment (move end to before this comment)
    end = before.lastIndexOf('-->', open - 1);
  }
  return null;
}

let out = '';
let last = 0;
let count = 0;
const renames = [];

let m;
while ((m = scriptRe.exec(html))) {
  const [full, preAttrs, oldSrcRel, numStr, postAttrs] = m;
  const scriptIdx = m.index;

  // Find immediate-above comment
  const titleRaw = findImmediateCommentAbove(html, scriptIdx);
  const slug = slugify(titleRaw);

  // If no usable comment, keep as-is
  if (!slug) {
    out += html.slice(last, scriptIdx) + full;
    last = scriptIdx + full.length;
    continue;
  }

  const oldAbs = path.join(projectDir, oldSrcRel);
  const ext = path.extname(oldSrcRel) || '.js';
  let base = slug + ext;
  let newAbs = path.join(projectDir, 'js/index', base);
  let i = 2;
  // resolve duplicates
  while (fs.existsSync(newAbs) && path.resolve(newAbs) !== path.resolve(oldAbs)) {
    base = `${slug}-${i}${ext}`;
    newAbs = path.join(projectDir, 'js/index', base);
    i++;
  }

  const newSrcRel = `js/index/${base}`;

  // Rename if file exists and isn't already the same path
  try {
    if (fs.existsSync(oldAbs) && path.resolve(oldAbs) !== path.resolve(newAbs)) {
      fs.renameSync(oldAbs, newAbs);
    }
  } catch (e) {
    console.warn(`[WARN] rename failed for:\n  from ${oldAbs}\n  to   ${newAbs}\n  reason: ${e.message}`);
    // If rename fails, leave tag unchanged
    out += html.slice(last, scriptIdx) + full;
    last = scriptIdx + full.length;
    continue;
  }

  // Rebuild <script> with same attrs but new src
  const rebuilt = `<script${preAttrs || ''} src="${newSrcRel}"${postAttrs || ''}></script>`;
  out += html.slice(last, scriptIdx) + `<!-- ${titleRaw || slug} -->\n` + rebuilt;
  last = scriptIdx + full.length;

  renames.push({ oldSrcRel, newSrcRel });
  count++;
}

// append remainder and write outputs
out += html.slice(last);
const backup = htmlPath.replace(/(\.html?)$/i, '.backup.$1');
const titled = htmlPath.replace(/(\.html?)$/i, '.titled.$1');
fs.writeFileSync(backup, html, 'utf8');
fs.writeFileSync(titled, out, 'utf8');

console.log(`Updated ${count} script tag(s).`);
if (renames.length) {
  console.log('Renames:');
  for (const r of renames) console.log(`- ${r.oldSrcRel} -> ${r.newSrcRel}`);
  console.log(`\nWrote:  ${titled}`);
  console.log(`Backup: ${backup}`);
} else {
  console.log('No eligible script tags found to title-ify.');
}
