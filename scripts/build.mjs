import process from 'node:process';
import { build } from 'esbuild';

const version = process.env.GFA_VERSION ?? 'dev';
const commitHash = process.env.GFA_COMMIT_HASH ?? 'unknown';
const commitTS = process.env.GFA_COMMIT_TS ?? 'unknown';

await build({
  entryPoints: ['src/gfa.tsx'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'dist/gfa',
  minify: true,
  define: {
    __VERSION__: JSON.stringify(version),
    __COMMIT_HASH__: JSON.stringify(commitHash),
    __COMMIT_TS__: JSON.stringify(commitTS),
  },
  banner: {
    js: '#!/usr/bin/env node\nimport { createRequire } from "node:module"; const require = createRequire(import.meta.url);',
  },
});
