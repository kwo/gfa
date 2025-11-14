# gfa

Git Fetch All (gfa) is a command-line tool that automatically discovers and manages all Git repositories within the current directory. It provides a comprehensive overview of repository states and performs batch operations like fetching and pulling across multiple repositories simultaneously.

## What it does

gfa scans the current directory for Git repositories and performs the following operations on each:

1. **Discovery**: Identifies all subdirectories containing Git repositories (`.git` folders)
2. **Status Check**: Determines if the working directory is clean or has uncommitted changes
3. **Branch Information**: Shows the current branch for each repository
4. **Remote Tracking**: Displays the relationship with remote branches (up-to-date, behind, etc.)
5. **Batch Operations**: Automatically fetches from all remotes and pulls when safe to do so
6. **Visual Feedback**: Presents results in a color-coded table format

## How it works

The tool operates in several phases:

1. **Scanning Phase**: Recursively scans the current directory for subdirectories containing `.git` folders
2. **Parallel Processing**: Processes all discovered repositories concurrently for optimal performance
3. **Git Operations**: For each repository:
   - Checks if it's a valid Git repository
   - Retrieves current branch information
   - Checks working directory status (clean/dirty)
   - Fetches from all remotes with pruning
   - Determines if the local branch is behind the remote
   - Automatically pulls if the working directory is clean and updates are available
4. **Real-time Display**: Updates the terminal display in real-time as operations complete

## Git Defaults and Behavior

gfa uses the following Git commands and defaults:

- **Fetch Command**: `git fetch --all --tags --prune --prune-tags --quiet`
  - `--all`: Fetches from all configured remotes
  - `--tags`: Fetches all tags
  - `--prune`: Removes remote-tracking branches that no longer exist on the remote
  - `--prune-tags`: Removes local tags that no longer exist on the remote
  - `--quiet`: Suppresses verbose output

- **Status Check**: `git status --porcelain`
  - Uses porcelain format for consistent, script-friendly output

- **Branch Information**: `git branch --show-current` and `git branch -vv`
  - Shows current branch and verbose branch information with tracking details

- **Pull Behavior**: Only pulls when:
  - Working directory is clean (no uncommitted changes)
  - Local branch is behind the remote branch
  - Uses default `git pull` (typically fast-forward merge)

## Dependencies

- **Git**: Must be installed and available in PATH
- **Node.js**: Runtime environment (bundled in standalone executable)

## Usage

```bash
gfa
```

### Interactive Controls

- **q**: Quit the application
- **Ctrl+C**: Force quit
- **Escape**: Quit the application

### Output Format

The tool displays a table with the following columns:

- **DIRECTORY**: Repository directory name
- **BRANCH**: Current Git branch
- **STATUS**: Working directory status (clean/dirty/no git/error)
- **REMOTE**: Remote tracking status (up-to-date/behind/no remote/etc.)
- **ACTION**: Last performed action (fetched/pulled/error details)

### Color Coding

- **Green**: Success states (clean status, up-to-date, successful operations)
- **Yellow**: Warning states (dirty working directory, behind remote, no remotes)
- **Red**: Error states (Git errors, repository issues)
- **Cyan**: Headers and directory names
- **White**: Default text

## Technologies Used

### Core Technologies

- **TypeScript**: Primary programming language for type safety and developer experience
- **React**: UI framework for building the terminal interface
- **Ink**: React renderer for CLI applications, enabling component-based terminal UIs
- **Node.js**: JavaScript runtime environment

### Build System

- **Bun**: Modern JavaScript runtime and bundler used for:
  - Building the production bundle
  - Creating a single executable file
  - Optimizing for Node.js target environment

### Development Tools

- **ESLint**: Code linting with TypeScript support
- **Prettier**: Code formatting
- **tsx**: TypeScript execution for development
- **npm-run-all**: Script orchestration for build processes

### Build Process

1. **Compilation**: Bun bundles the TypeScript source into a single JavaScript file
2. **Executable Creation**: A shebang (`#!/usr/bin/env node`) is prepended to create a standalone executable
3. **Distribution**: The resulting binary can be copied to any location in PATH

### Architecture

- **Component-Based**: Uses React components for UI structure
- **Async/Parallel Processing**: Leverages Promise.all for concurrent repository processing
- **Real-time Updates**: State management enables live updates as operations complete
- **Error Handling**: Comprehensive error handling with user-friendly error messages

## Development

gfa is a TypeScript application that compiles to a standalone Node.js executable. The build process uses Bun for optimal bundling and performance.

### Development Commands

```bash
# Run in development mode
npm run dev

# Build production executable
npm run build

# Run linting
npm run lint

# Format code
npm run lint:formatfix
```

## Reference

- [Original gfa inspiration](https://gist.github.com/kwo/bbd251ab1d3392ad95dc889948177a78)
- [Node.js Releases](https://nodejs.org/en/about/previous-releases)

## TODO

- Handle terminal height constraints for large repository lists
- Add comprehensive test suite
- Add configuration file support for custom Git commands
- Support for custom directory scanning depth
