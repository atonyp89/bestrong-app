// Turns Vite's single-file build into the shape the Claude artifact host publishes: no doctype,
// <html>, <head> or <body> (the host wraps the page in its own skeleton with charset and viewport).
// Output: dist/ironlog.html — title and meta first, then fonts, styles, markup and the inlined script.
import { readFileSync, writeFileSync } from 'node:fs';

const src = readFileSync('dist/index.html', 'utf8');
const all = re => [...src.matchAll(re)].map(m => m[0]);

const head = src.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? '';
const body = src.match(/<body>([\s\S]*?)<\/body>/)?.[1] ?? '';
const scriptRe = /<script\b[^>]*>[\s\S]*?<\/script>/g;

const title = head.match(/<title>[\s\S]*?<\/title>/)?.[0];
if (!title) throw new Error('dist/index.html has no <title>');

const parts = [
  title,
  ...(head.match(/<meta name="claude:[^>]*>/g) ?? []),
  ...(head.match(/<link\b[^>]*>/g) ?? []),
  ...(head.match(/<style\b[^>]*>[\s\S]*?<\/style>/g) ?? []),
  body.replace(scriptRe, '').trim(),
  ...all(scriptRe),
];

writeFileSync('dist/ironlog.html', parts.join('\n') + '\n');
console.log(`dist/ironlog.html written (${(Buffer.byteLength(parts.join('\n')) / 1024).toFixed(1)} KB)`);
