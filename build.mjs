import { build } from 'esbuild';

await build({
  entryPoints: ['src/gfa.tsx'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'dist/gfa',
  minify: true,
  banner: {
    js: '#!/usr/bin/env node\nimport { createRequire } from "node:module"; const require = createRequire(import.meta.url);',
  },
});
