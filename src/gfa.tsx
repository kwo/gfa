import { useState, useEffect } from 'react';
import { render, Text, Box, useInput, useApp } from 'ink';
import { exec, execFile } from 'child_process';
import { promises as fs } from 'fs';
import { basename } from 'path';
import { promisify } from 'util';

declare const __VERSION__: string;

const execPromise = promisify(exec);
const execFilePromise = promisify(execFile);
const VERSION = __VERSION__;

// TypeScript Interfaces
interface RepoState {
  [key: string]: string | number | boolean | null | undefined;
  directory: string;
  branch: string;
  status: string;
  remote: string;
  action: string;
}

interface CliOptions {
  switchDefaultBranch: boolean;
  deleteMergedBranches: boolean;
  restorePackageLock: boolean;
}

interface DirtyFile {
  status: string;
  path: string;
}

// Custom Table Component
interface TableProps {
  data: RepoState[];
}

const Table = ({ data }: TableProps) => {
  if (data.length === 0) {
    return null;
  }

  // Calculate column widths
  type ColumnName = 'directory' | 'branch' | 'status' | 'remote' | 'action';
  const columns: ColumnName[] = ['directory', 'branch', 'status', 'remote', 'action'];

  const widths = {} as Record<ColumnName, number>;
  columns.forEach(col => {
    widths[col] = Math.max(col.length, ...data.map(row => String(row[col] ?? '').length));
  });

  // Helper to pad text
  const pad = (text: string, width: number) => {
    return text.padEnd(width, ' ');
  };

  // Helper to get color based on status
  const getStatusColor = (status: string): string => {
    if (status.includes('error')) {
      return 'red';
    }

    if (status === 'clean') {
      return 'green';
    }

    if (status === 'dirty') {
      return 'yellow';
    }

    if (status === 'no git') {
      return 'yellow';
    }

    return 'white';
  };

  const getRemoteColor = (remote: string): string => {
    if (remote.includes('behind')) {
      return 'yellow';
    }

    if (remote === 'up-to-date') {
      return 'green';
    }

    if (remote.includes('no remote')) {
      return 'yellow';
    }

    return 'white';
  };

  const getActionColor = (action: string): string => {
    if (
      action === 'pulled' ||
      action === 'fetched' ||
      action.startsWith('restored') ||
      action.startsWith('switched') ||
      action.startsWith('deleted') ||
      action === 'on default' ||
      action === 'no merged branches'
    ) {
      return 'green';
    }

    if (action.includes('skipped')) {
      return 'yellow';
    }

    return 'white';
  };

  return (
    <Box flexDirection="column">
      {/* Header */}
      <Box>
        <Text bold color="cyan">
          {pad('DIRECTORY', widths.directory + 2)}
        </Text>
        <Text bold color="cyan">
          {pad('BRANCH', widths.branch + 2)}
        </Text>
        <Text bold color="cyan">
          {pad('STATUS', widths.status + 2)}
        </Text>
        <Text bold color="cyan">
          {pad('REMOTE', widths.remote + 2)}
        </Text>
        <Text bold color="cyan">
          {pad('ACTION', widths.action + 2)}
        </Text>
      </Box>

      {/* Rows */}
      {data.map((row, i) => (
        <Box key={`${row.directory}-${String(i)}`}>
          <Text color="cyan">{pad(row.directory, widths.directory + 2)}</Text>
          <Text>{pad(row.branch, widths.branch + 2)}</Text>
          <Text color={getStatusColor(row.status)}>{pad(row.status, widths.status + 2)}</Text>
          <Text color={getRemoteColor(row.remote)}>{pad(row.remote, widths.remote + 2)}</Text>
          <Text color={getActionColor(row.action)}>{pad(row.action, widths.action + 2)}</Text>
        </Box>
      ))}
    </Box>
  );
};

// Utility Functions

/**
 * Scan directory for subdirectories or check if current dir is a git repo
 */
const scanDirectory = async (dir: string): Promise<string[]> => {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const subdirs = dirents.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);

  // Check if current directory is a git repo
  if (subdirs.includes('.git')) {
    return ['.'];
  }

  return subdirs;
};

const getCurrentBranch = async (dir: string): Promise<string> => {
  const { stdout } = await execPromise('git branch --show-current', { cwd: dir });
  return stdout.trim();
};

const getDirtyFiles = async (dir: string): Promise<DirtyFile[]> => {
  const { stdout } = await execPromise('git status --porcelain', { cwd: dir });

  return stdout
    .split('\n')
    .map(line => line.trimEnd())
    .filter(line => line.length > 0)
    .map(line => {
      const rawPath = line.slice(3);
      const path = rawPath.includes(' -> ') ? (rawPath.split(' -> ').pop() ?? rawPath) : rawPath;

      return {
        status: line.slice(0, 2),
        path,
      };
    });
};

const restorePackageLockIfOnlyDirty = async (dir: string): Promise<boolean> => {
  const dirtyFiles = await getDirtyFiles(dir);

  if (dirtyFiles.length === 0) {
    return false;
  }

  if (!dirtyFiles.every(file => basename(file.path) === 'package-lock.json')) {
    return false;
  }

  const trackedPaths = dirtyFiles.filter(file => file.status !== '??').map(file => file.path);
  const untrackedPaths = dirtyFiles.filter(file => file.status === '??').map(file => file.path);

  if (trackedPaths.length > 0) {
    await execFilePromise('git', ['restore', '--staged', '--worktree', '--', ...trackedPaths], {
      cwd: dir,
    });
  }

  if (untrackedPaths.length > 0) {
    await execFilePromise('git', ['clean', '-f', '--', ...untrackedPaths], { cwd: dir });
  }

  return true;
};

const getDefaultBranch = async (dir: string): Promise<string> => {
  try {
    const { stdout } = await execFilePromise(
      'git',
      ['symbolic-ref', '--quiet', '--short', 'refs/remotes/origin/HEAD'],
      { cwd: dir }
    );
    return String(stdout)
      .trim()
      .replace(/^origin\//, '');
  } catch {
    await execFilePromise('git', ['remote', 'set-head', 'origin', '--auto'], { cwd: dir });
    const { stdout } = await execFilePromise(
      'git',
      ['symbolic-ref', '--quiet', '--short', 'refs/remotes/origin/HEAD'],
      { cwd: dir }
    );
    return String(stdout)
      .trim()
      .replace(/^origin\//, '');
  }
};

const switchToDefaultBranch = async (dir: string, defaultBranch: string): Promise<void> => {
  let hasLocalBranch: boolean;

  try {
    await execFilePromise(
      'git',
      ['show-ref', '--verify', '--quiet', `refs/heads/${defaultBranch}`],
      {
        cwd: dir,
      }
    );
    hasLocalBranch = true;
  } catch {
    hasLocalBranch = false;
  }

  if (hasLocalBranch) {
    await execFilePromise('git', ['switch', defaultBranch], { cwd: dir });
  } else {
    await execFilePromise(
      'git',
      ['switch', '--track', '-c', defaultBranch, `origin/${defaultBranch}`],
      {
        cwd: dir,
      }
    );
  }
};

const getCurrentRemoteStatus = async (
  dir: string
): Promise<{ status: string; needPull: boolean }> => {
  const { stdout } = await execPromise('git --no-pager branch -vv', { cwd: dir });
  const branchStatus = stdout.split('\n').map(l => l.trim());

  for (const branch of branchStatus) {
    if (branch.startsWith('*')) {
      const match = /\[\s*([^:]+)(:\s(.+)\s*)?\]/.exec(branch);

      if (!match) {
        return { status: 'no remote branch', needPull: false };
      }

      const status = match[3] ?? 'up-to-date';
      return { status, needPull: status.includes('behind') };
    }
  }

  return { status: 'no remote branch', needPull: false };
};

const deleteMergedBranches = async (
  dir: string,
  defaultBranch: string
): Promise<{ deleted: number; skipped: number }> => {
  const currentBranch = await getCurrentBranch(dir);
  const { stdout } = await execFilePromise(
    'git',
    ['branch', '--format=%(refname:short)', '--merged', `origin/${defaultBranch}`],
    {
      cwd: dir,
    }
  );
  const branches = String(stdout)
    .split('\n')
    .map(branch => branch.trim())
    .filter(branch => branch.length > 0)
    .filter(branch => branch !== currentBranch && branch !== defaultBranch);

  let deleted = 0;
  let skipped = 0;

  for (const branch of branches) {
    try {
      await execFilePromise('git', ['branch', '-d', branch], { cwd: dir });
      deleted += 1;
    } catch {
      skipped += 1;
    }
  }

  return { deleted, skipped };
};

/**
 * Process a single repository through all git operations
 */
const processRepo = async (
  dir: string,
  options: CliOptions,
  updateFn: (update: Partial<RepoState>) => void
): Promise<void> => {
  // Check if git repo
  try {
    const dirents = await fs.readdir(dir, { withFileTypes: true });
    const isGit = dirents.some(d => d.isDirectory() && d.name === '.git');

    if (!isGit) {
      updateFn({ status: 'no git', branch: '', remote: '', action: '' });
      return;
    }
  } catch (x) {
    updateFn({ status: 'error', action: String(x), branch: '', remote: '' });
    return;
  }

  // Get branch
  try {
    updateFn({ branch: await getCurrentBranch(dir) });
  } catch (x) {
    updateFn({ status: 'error', action: String(x) });
    return;
  }

  // Optionally restore package-lock.json files when they are the only dirty files.
  if (options.restorePackageLock) {
    try {
      if (await restorePackageLockIfOnlyDirty(dir)) {
        updateFn({ action: 'restored package-lock' });
      }
    } catch (x) {
      updateFn({ status: 'error', action: String(x) });
      return;
    }
  }

  // Check dirty status
  let dirty = false;
  try {
    const dirtyFiles = await getDirtyFiles(dir);
    if (dirtyFiles.length === 0) {
      updateFn({ status: 'clean' });
    } else {
      updateFn({ status: 'dirty' });
      dirty = true;
    }
  } catch (x) {
    updateFn({ status: 'error', action: String(x) });
    return;
  }

  // Check for remotes
  try {
    const { stdout } = await execPromise('git remote', { cwd: dir });
    if (stdout.trim().length === 0) {
      updateFn({ remote: 'no remotes', action: '' });
      return;
    }
  } catch (x) {
    updateFn({ status: 'error', action: String(x) });
    return;
  }

  // Fetch
  try {
    await execPromise('git fetch --all --tags --prune --prune-tags --quiet', {
      cwd: dir,
    });
    updateFn({ action: 'fetched' });
  } catch (x) {
    updateFn({ status: 'error', action: String(x) });
    return;
  }

  let defaultBranch: string | null = null;

  if ((options.switchDefaultBranch || options.deleteMergedBranches) && !dirty) {
    try {
      defaultBranch = await getDefaultBranch(dir);
    } catch (x) {
      updateFn({ status: 'error', action: String(x) });
      return;
    }
  }

  if (options.switchDefaultBranch) {
    if (dirty) {
      updateFn({ action: 'dirty; skipped switch' });
    } else if (defaultBranch) {
      try {
        const currentBranch = await getCurrentBranch(dir);
        if (currentBranch === defaultBranch) {
          updateFn({ action: 'on default' });
        } else {
          await switchToDefaultBranch(dir, defaultBranch);
          updateFn({ branch: await getCurrentBranch(dir), action: `switched ${defaultBranch}` });
        }
      } catch (x) {
        updateFn({ status: 'error', action: String(x) });
        return;
      }
    }
  }

  // Check remote status
  let needPull: boolean;
  try {
    const remoteStatus = await getCurrentRemoteStatus(dir);
    needPull = remoteStatus.needPull;
    updateFn({ remote: remoteStatus.status });
  } catch (x) {
    updateFn({ status: 'error', action: String(x) });
    return;
  }

  // Pull if needed and not dirty
  if (!dirty && needPull) {
    try {
      await execPromise('git pull', { cwd: dir });
      updateFn({ action: 'pulled' });
    } catch (x) {
      updateFn({ status: 'error', action: String(x) });
      return;
    }
  }

  if (options.deleteMergedBranches) {
    if (dirty) {
      updateFn({ action: 'dirty; skipped delete' });
      return;
    }

    try {
      if (!defaultBranch) {
        updateFn({ status: 'error', action: 'default branch not found' });
        return;
      }

      const { deleted, skipped } = await deleteMergedBranches(dir, defaultBranch);
      if (deleted > 0 || skipped > 0) {
        const skippedText = skipped > 0 ? `, skipped ${String(skipped)}` : '';
        updateFn({ action: `deleted ${String(deleted)}${skippedText}` });
      } else {
        updateFn({ action: 'no merged branches' });
      }
    } catch (x) {
      updateFn({ status: 'error', action: String(x) });
    }
  }
};

// Main App Component
const App = ({ options }: { options: CliOptions }) => {
  const [repos, setRepos] = useState<RepoState[]>([]);
  const [status, setStatus] = useState('scanning...');
  const { exit } = useApp();

  // Handle keyboard input for exit (only if stdin supports raw mode)
  useInput(
    (input, key) => {
      if (input === 'q' || (key.ctrl && input === 'c') || key.escape) {
        exit();
      }
    },
    { isActive: process.stdin.isTTY ?? false }
  );

  // Initialize and process repositories
  useEffect(() => {
    const init = async () => {
      try {
        // Scan for directories
        const dirs = await scanDirectory('.');

        // Initialize repo states
        const initialRepos: RepoState[] = dirs.map(dir => ({
          directory: dir,
          branch: '...',
          status: '...',
          remote: '...',
          action: '...',
        }));
        setRepos(initialRepos);

        // Start processing
        setStatus('working...');

        // Process all repos in parallel
        await Promise.all(
          dirs.map((dir, index) =>
            processRepo(dir, options, update => {
              setRepos(prev => {
                const newRepos = [...prev];
                const existing = newRepos[index];
                if (existing) {
                  newRepos[index] = { ...existing, ...update };
                }
                return newRepos;
              });
            })
          )
        );

        // Done
        setStatus('done');
        // Exit after a short delay to show final status
        setTimeout(() => {
          exit();
        }, 50);
      } catch (err) {
        setStatus(`error: ${String(err)}`);
        // Exit on error after showing the error
        setTimeout(() => {
          exit(new Error(String(err)));
        }, 50);
      }
    };

    void init();
  }, [exit, options]);

  return (
    <Box flexDirection="column">
      <Table data={repos} />
      <Box marginTop={1}>
        <Text dimColor>{status}</Text>
      </Box>
    </Box>
  );
};

const parseCliOptions = (args: string[]): CliOptions & { showVersion: boolean } => {
  const options = {
    switchDefaultBranch: false,
    deleteMergedBranches: false,
    restorePackageLock: false,
    showVersion: false,
  };

  for (const arg of args) {
    if (arg === '--version') {
      options.showVersion = true;
      continue;
    }

    if (arg === '--switch-default-branch') {
      options.switchDefaultBranch = true;
      continue;
    }

    if (arg === '--delete-merged-branches') {
      options.deleteMergedBranches = true;
      continue;
    }

    if (arg === '--restore-package-lock') {
      options.restorePackageLock = true;
      continue;
    }

    if (arg.startsWith('-') && !arg.startsWith('--')) {
      for (const flag of arg.slice(1)) {
        if (flag === 'v') {
          options.showVersion = true;
        }

        if (flag === 's') {
          options.switchDefaultBranch = true;
        }

        if (flag === 'd') {
          options.deleteMergedBranches = true;
        }

        if (flag === 'R') {
          options.restorePackageLock = true;
        }
      }
    }
  }

  return options;
};

const options = parseCliOptions(process.argv.slice(2));

if (options.showVersion) {
  console.log(VERSION);
  process.exit(0);
}

// Render the app
render(<App options={options} />, { exitOnCtrlC: false });
