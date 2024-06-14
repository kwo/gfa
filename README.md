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

To create the single javascript file: `bun run bundle`. The file will be localed at `./build/index.js`.

## References

- [mjs without extension](https://2ality.com/2022/07/nodejs-esm-shell-scripts.html#unix%3A-arbitrary-filename-extension-via-a-shell-prolog)
- [original gfa](https://gist.github.com/kwo/bbd251ab1d3392ad95dc889948177a78)

## TODO

- check that origin is available before fetching, pulling
- state status per line in another color and overwrite when done
- work when curdir is repo
- run fetch and dirty in parallel
- rwrite as pure javascript, no typescript, no bun
