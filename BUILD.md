# Build and Release Maintenance

This document covers the tagged release workflow and the manual Homebrew/Linuxbrew tap update process for `gfa`.

## Release workflow

Tagged releases are created from GitHub Actions.

Example:

```bash
git tag v1.2.3
git push origin v1.2.3
```

The release workflow publishes these release assets:

- `gfa_v<version>.tar.gz`
- `SHA256SUMS`

Archive layout is binary-only:

- the archive extracts a single `gfa` executable at the archive root

Notes:

- `gfa` is a bundled Node.js CLI, not a native compiled binary
- the release build embeds the Git tag as the CLI version string
- Homebrew should declare a `node` dependency so the installed `gfa` script can run

## Generate the Homebrew formula

From this repository, generate a ready-to-commit `gfa.rb` formula on stdout.

Latest stable release:

```bash
scripts/homebrew-formula
```

Specific tag:

```bash
scripts/homebrew-formula --tag v1.2.3
```

The script:

- uses `gh release list` to select the latest published non-draft, non-prerelease release by default
- uses `gh release view` to inspect release assets
- downloads and parses the release `SHA256SUMS`
- generates a formula that points at the single release archive
- fails if `gh` is missing, unusable, or the release is missing required assets

## Update the tap

Tap repository:

- `kwo/homebrew-tools`

Tap command for users:

```bash
brew tap kwo/tools
```

Manual update flow:

1. Cut and publish the `gfa` GitHub release.
2. Generate the formula from this repo:
   ```bash
   scripts/homebrew-formula --tag v1.2.3 > ../homebrew-tools/gfa.rb
   ```
3. Review the generated formula in `../homebrew-tools/gfa.rb`.
4. Commit and push the tap update from `kwo/homebrew-tools`.

User install command after the tap contains the formula:

```bash
brew install gfa
```
