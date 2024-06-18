# gfa

Also known as Git Fetch All, gfa, fetches and pulls all git repositories that are subdirectories of the current directory.

## Dependencies

- Node v20+ https://nodejs.org/en/about/previous-releases
- Git

## Usage

```bash
gfa
```

## Development

`gfa` is a javascript program, written in Typescript, bundled with `esbuild`, targeting `node 20` environments. It is distributed as a single javascript file and can be run it you have node and git installed on your machine.

To create the single javascript file: `bun run build`. The file will be localed at `./gfa`.

## References

- [original gfa](https://gist.github.com/kwo/bbd251ab1d3392ad95dc889948177a78)
- [mjs without extension](https://2ality.com/2022/07/nodejs-esm-shell-scripts.html#unix%3A-arbitrary-filename-extension-via-a-shell-prolog)

## TODO

- issue where screen is shorter than lines
- eslint
- tests
