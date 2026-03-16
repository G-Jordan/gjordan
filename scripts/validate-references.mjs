#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const textExts = new Set(['.html', '.css']);
const files = [];
const ignorePrefixes = ['http://','https://','//','data:','mailto:','tel:','#','blob:'];
const missing = [];

function walk(dir){
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (textExts.has(path.extname(entry.name))) files.push(full);
  }
}

function resolveTarget(ref, fromFile, baseHref = null){
  const clean = ref.split('?')[0].split('#')[0].trim();
  if (!clean || ignorePrefixes.some(p => clean.startsWith(p))) return null;
  if (clean.includes('${') || /[(),]/.test(clean)) return null;
  if (baseHref === '/' && !clean.startsWith('/')) return path.join(root, clean);
  return clean.startsWith('/') ? path.join(root, clean.slice(1)) : path.resolve(path.dirname(fromFile), clean);
}

function scanHtml(file){
  const txt = fs.readFileSync(file, 'utf8');
  const baseMatch = txt.match(/<base\b[^>]*href=["']([^"']+)["']/i);
  const baseHref = baseMatch ? baseMatch[1] : null;
  const refs = [];
  const patterns = [
    /<(?:script|img|source)\b[^>]*?\bsrc=["']([^"']+)["']/gi,
    /<(?:link|a)\b[^>]*?\bhref=["']([^"']+)["']/gi,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(txt))) refs.push(m[1]);
  }
  for (const ref of refs) {
    const target = resolveTarget(ref, file, baseHref);
    if (target && !fs.existsSync(target)) missing.push({ file: path.relative(root, file), ref });
  }
}

function scanCss(file){
  const txt = fs.readFileSync(file, 'utf8');
  const re = /url\((["']?)([^)"']+)\1\)/gi;
  let m;
  while ((m = re.exec(txt))) {
    const target = resolveTarget(m[2], file, null);
    if (target && !fs.existsSync(target)) missing.push({ file: path.relative(root, file), ref: m[2] });
  }
}

walk(root);
for (const file of files) {
  if (file.endsWith('.html')) scanHtml(file);
  else scanCss(file);
}

if (!missing.length) {
  console.log('✓ No missing local HTML/CSS references found.');
  process.exit(0);
}

console.log('Missing local HTML/CSS references:');
for (const item of missing) console.log(`- ${item.file} -> ${item.ref}`);
process.exit(1);
