import process from 'node:process';
import { build } from 'esbuild';

const version = process.env.GFA_VERSION ?? 'dev';

await build({
  entryPoints: ['src/gfa.tsx'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'dist/gfa',
  minify: true,
  define: {
    __VERSION__: JSON.stringify(version),
  },
  banner: {
    js: '#!/usr/bin/env node\nimport { createRequire } from "node:module"; const require = createRequire(import.meta.url);',
  },
});
