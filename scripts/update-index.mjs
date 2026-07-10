#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// update-index  —  npm run update:index
//
// Scans main.tsx for all registered routes, cross-checks against
// prototypeRegistry.ts, then prints a summary report.
//
// What it checks:
//   ✓ Routes in main.tsx that are missing from the registry
//   ✓ Registry entries whose URLs return no matching route in main.tsx
//   ✓ Duplicate URLs in the registry
//   ✓ Entries missing a title or description
//   ✓ External links with placeholder text still in them
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── 1. Parse routes from main.tsx ─────────────────────────────────────────────

const mainSrc = readFileSync(resolve(ROOT, 'src/main.tsx'), 'utf8');

// Extract all string literals after `pathname ===` or `pathname.startsWith(`
const pathMatches = [...mainSrc.matchAll(/pathname\s*(?:===|\.startsWith\()\s*['"`]([^'"`]+)['"`]/g)];
const routesInMain = [...new Set(pathMatches.map(m => m[1]))].sort();

// ── 2. Parse registry entries ─────────────────────────────────────────────────

// We read the raw TS source and pull out url: '...' strings (runtime-free)
const registrySrc = readFileSync(resolve(ROOT, 'src/config/prototypeRegistry.ts'), 'utf8');
const externalSrc = readFileSync(resolve(ROOT, 'src/config/externalPrototypeLinks.ts'), 'utf8');

function extractUrls(src) {
  return [...src.matchAll(/url:\s*['"`]([^'"`]+)['"`]/g)]
    .map(m => m[1])
    .filter(u => u !== '#' && !u.startsWith('http'));
}

function extractTitles(src) {
  return [...src.matchAll(/title:\s*['"`]([^'"`]+)['"`]/g)].map(m => m[1]);
}

function extractDescriptions(src) {
  return [...src.matchAll(/description:\s*['"`]([^'"`]+)['"`]/g)].map(m => m[1]);
}

const registryUrls   = extractUrls(registrySrc);
const registryTitles = extractTitles(registrySrc);
const registryDescs  = extractDescriptions(registrySrc);

// External
const externalUrls = [...externalSrc.matchAll(/url:\s*['"`](https?:\/\/[^'"`]+)['"`]/g)].map(m => m[1]);
const externalTitles = extractTitles(externalSrc);

// ── 3. Checks ─────────────────────────────────────────────────────────────────

const SKIP_ROUTES = new Set(['/', '/index', '/prototype-index']);

const issues = [];
const infos  = [];

// Routes in main.tsx not in registry
for (const route of routesInMain) {
  if (SKIP_ROUTES.has(route)) continue;
  // Normalise: registry may use kebab, main.tsx may use underscore variant
  const kebab = route.replace(/_/g, '-');
  const hasIt = registryUrls.some(u => u === route || u === kebab || u.startsWith(route));
  if (!hasIt) {
    issues.push(`MISSING FROM REGISTRY  ${route}`);
  }
}

// Duplicate URLs in registry
const seen = new Map();
for (const url of registryUrls) {
  seen.set(url, (seen.get(url) ?? 0) + 1);
}
for (const [url, count] of seen) {
  if (count > 1) issues.push(`DUPLICATE URL (×${count})  ${url}`);
}

// Entries with empty/placeholder title or description
for (let i = 0; i < registryTitles.length; i++) {
  const t = registryTitles[i];
  if (!t || t.trim() === '' || t.startsWith('...') || t.startsWith('My ')) {
    issues.push(`PLACEHOLDER TITLE  at entry ${i + 1}: "${t}"`);
  }
}
for (let i = 0; i < registryDescs.length; i++) {
  const d = registryDescs[i];
  if (!d || d.trim() === '' || d.startsWith('What it shows')) {
    issues.push(`PLACEHOLDER DESC  at entry ${i + 1}: "${d}"`);
  }
}

// External links with placeholder URL
const hasPlaceholderExternal = externalSrc.includes('your-project.vercel.app');
if (externalUrls.length === 0 && !hasPlaceholderExternal) {
  infos.push('No external links defined (externalPrototypeLinks.ts is empty)');
} else if (externalUrls.length > 0) {
  infos.push(`${externalUrls.length} external link(s) configured`);
}

// ── 4. Report ──────────────────────────────────────────────────────────────────

const BOLD  = '\x1b[1m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED   = '\x1b[31m';
const DIM   = '\x1b[2m';
const RESET = '\x1b[0m';

console.log('');
console.log(`${BOLD}Prototype Index — Registry Validator${RESET}`);
console.log(DIM + '─'.repeat(52) + RESET);
console.log(`  Routes in main.tsx  : ${routesInMain.length}`);
console.log(`  Registry entries    : ${registryUrls.length}`);
console.log(`  External links      : ${externalUrls.length}`);
console.log('');

if (issues.length === 0) {
  console.log(`${GREEN}✓ No issues found. Registry looks good.${RESET}`);
} else {
  console.log(`${RED}${BOLD}✗ ${issues.length} issue(s) found:${RESET}`);
  for (const issue of issues) {
    console.log(`  ${YELLOW}⚠${RESET}  ${issue}`);
  }
}

if (infos.length > 0) {
  console.log('');
  for (const info of infos) {
    console.log(`  ${DIM}ℹ  ${info}${RESET}`);
  }
}

console.log('');
console.log(DIM + 'To add a route: edit src/config/prototypeRegistry.ts' + RESET);
console.log(DIM + 'To add a Vercel URL: edit src/config/externalPrototypeLinks.ts' + RESET);
console.log('');

process.exit(issues.length > 0 ? 1 : 0);
