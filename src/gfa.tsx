import { useState, useEffect } from 'react';
import { render, Text, Box, useInput, useApp } from 'ink';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { promisify } from 'util';

const execPromise = promisify(exec);

// TypeScript Interfaces
interface RepoState {
  [key: string]: string | number | boolean | null | undefined;
  directory: string;
  branch: string;
  status: string;
  remote: string;
  action: string;
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
    if (action === 'pulled') {
      return 'green';
    }

    if (action === 'fetched') {
      return 'green';
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

/**
 * Process a single repository through all git operations
 */
const processRepo = async (
  dir: string,
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
    const { stdout } = await execPromise('git branch --show-current', {
      cwd: dir,
    });
    const branch = stdout.trim();
    updateFn({ branch });
  } catch (x) {
    updateFn({ status: 'error', action: String(x) });
    return;
  }

  // Check dirty status
  let dirty = false;
  try {
    const { stdout } = await execPromise('git status --porcelain', { cwd: dir });
    if (stdout.trim().length === 0) {
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

  // Check remote status
  let needPull = false;
  try {
    const { stdout } = await execPromise('git --no-pager branch -vv', {
      cwd: dir,
    });
    const branchStatus = stdout.split('\n').map(l => l.trim());
    let status = '';
    for (const branch of branchStatus) {
      if (branch.startsWith('*')) {
        const match = /\[\s*([^:]+)(:\s(.+)\s*)?\]/.exec(branch);
        if (!match) {
          updateFn({ remote: 'no remote branch' });
          return;
        }

        status = match[3] ?? '';
      }
    }

    status = status || 'up-to-date';
    needPull = status.includes('behind');
    updateFn({ remote: status });
  } catch (x) {
    updateFn({ status: 'error', action: String(x) });
    return;
  }

  // Pull if needed and not dirty
  if (dirty || !needPull) {
    return;
  }

  try {
    await execPromise('git pull', { cwd: dir });
    updateFn({ action: 'pulled' });
  } catch (x) {
    updateFn({ status: 'error', action: String(x) });
    return;
  }
};

// Main App Component
const App = () => {
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
            processRepo(dir, update => {
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
  }, [exit]);

  return (
    <Box flexDirection="column">
      <Table data={repos} />
      <Box marginTop={1}>
        <Text dimColor>{status}</Text>
      </Box>
    </Box>
  );
};

// Render the app
render(<App />, { exitOnCtrlC: false });
