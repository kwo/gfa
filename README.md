# gfa

Also known as Git Fetch All, gfa, fetches and pulls all git repositories that are subdirectories of the current directory.

## Dependencies

- Node v18+
- Git

## Usage

```bash
gfa
```

## Development

`gfa` is a javascript program, written in Typescript, built with `bun` yet targeting `node` environments. It is distributed as a single javascript file and can be run it you have node and git installed on your machine.

To create the single javascript file: `bun run build`. The file will be localed at `./gfa`.

## References

- [mjs without extension](https://2ality.com/2022/07/nodejs-esm-shell-scripts.html#unix%3A-arbitrary-filename-extension-via-a-shell-prolog)
- [original gfa](https://gist.github.com/kwo/bbd251ab1d3392ad95dc889948177a78)

## TODO

- check that origin is available before fetching, pulling
- skip pull, clean if fetch reveals no changes
- rwrite as pure javascript, no typescript, no bun
- eslint
- tests
