import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const entryPoints = [
  { in: 'src/content/index.ts', out: 'dist/content/index' },
  { in: 'src/background/service-worker.ts', out: 'dist/background/service-worker' },
  { in: 'src/offscreen/offscreen.ts', out: 'dist/offscreen/offscreen' },
];

await esbuild.build({
  entryPoints,
  bundle: true,
  format: 'esm',
  outdir: '.',
  outExtension: { '.js': '.js' },
  platform: 'browser',
  target: 'chrome120',
  sourcemap: true,
});

// Copy static files
const copies = [
  ['manifest.json', 'dist/manifest.json'],
  ['src/offscreen/offscreen.html', 'dist/offscreen/offscreen.html'],
];

for (const [src, dest] of copies) {
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
}

console.log('Extension build complete.');
