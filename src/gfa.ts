import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { promisify } from 'util';
const execPromise = promisify(exec);

import { Line, Lines } from './lines';

const lines: Lines = new Lines();

const process = async (line: Line, dir: string) => {
  line.text = Line.field(Line.cyan(dir), 30);

  // check if git repo
  line.mark(Line.word(Line.green('checking git...')));
  try {
    const dirents = await fs.readdir(dir, { withFileTypes: true });
    const isGit = dirents
      .filter(d => d.isDirectory())
      .map(d => d.name)
      .includes('.git');
    line.clear();
    if (!isGit) {
      line.append(Line.word(Line.yellow('no git')));
      return;
    }
  } catch (x) {
    line.append(Line.word(Line.red(x)));
    return;
  }

  // branch
  line.mark(Line.word(Line.green('loading branch...')));
  try {
    const { stdout } = await execPromise('git branch --show-current', { cwd: dir });
    const branch = stdout.trim();
    line.clear(Line.field(branch, 10));
  } catch (x) {
    line.append(Line.word(Line.red(x)));
    return;
  }

  // dirty
  let dirty = false;
  line.mark(Line.word(Line.green('getting status...')));
  try {
    const { stdout } = await execPromise('git status --porcelain', { cwd: dir });
    if (stdout.trim().length === 0) {
      line.clear(Line.word('clean'));
    } else {
      line.clear(Line.word('dirty'));
      dirty = true;
    }
  } catch (x) {
    line.append(Line.word(Line.red(x)));
    return;
  }

  // has remote
  line.mark(Line.word(Line.green('checking remotes...')));
  try {
    const { stdout } = await execPromise('git remote', { cwd: dir });
    if (stdout.trim().length === 0) {
      line.clear(Line.word(Line.yellow('no remotes')));
      return;
    } else {
      line.clear();
    }
  } catch (x) {
    line.append(Line.word(Line.red(x)));
    return;
  }

  // fetch
  line.mark(Line.word(Line.green('fetching...')));
  try {
    await execPromise('git fetch --all --tags --prune --prune-tags --quiet', { cwd: dir });
    line.clear(Line.word('fetched'));
  } catch (x) {
    line.append(Line.word(Line.red(x)));
    return;
  }

  // remote status
  let needPull = false;
  line.mark(Line.word(Line.green('remote status...')));
  try {
    const { stdout } = await execPromise('git --no-pager branch -vv', { cwd: dir });
    const branchStatus = stdout.split('\n').map(l => l.trim());
    let status = '';
    for (const branch of branchStatus) {
      if (branch.startsWith('*')) {
        const match = /\[\s*([^:]+)(:\s(.+)\s*)?\]/.exec(branch);
        if (!match) {
          line.clear(Line.word(Line.yellow('no remote branch')));
          return;
        }
        [, , , status] = match; // , branch, , status
      }
    }
    status = status || 'up-to-date';
    needPull = status.includes('behind');
    line.clear(Line.field(status, 11));
  } catch (x) {
    line.append(Line.word(Line.red(x)));
    return;
  }

  if (dirty || !needPull) {
    return;
  }

  // pull
  line.mark(Line.word(Line.green('pulling...')));
  try {
    await execPromise('git pull', { cwd: dir });
    line.clear(Line.word('pulled'));
  } catch (x) {
    line.append(Line.word(Line.red(x)));
    return;
  }
};

const main = async (dir: string) => {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  let subdirs = dirents.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);
  // check if current directory is a git repo
  if (subdirs.includes('.git')) {
    subdirs = ['.'];
  }

  // prepare lines
  subdirs.forEach(() => lines.add());
  lines.add(); // last line is status

  // launch processes
  lines.last.text = 'working...';
  const promises: Promise<void>[] = [];
  subdirs.forEach((subdirName, i) => {
    promises.push(process(lines.line(i), subdirName));
  });
  return Promise.all(promises);
};

main('.')
  .then(() => (lines.last.text = 'done'))
  .catch((err: unknown) => (lines.last.text = Line.red(err)));
