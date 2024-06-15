import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import ansi from 'ansi-escape-sequences';
const execPromise = promisify(exec);

import { Line, Lines } from './lines';

const lines: Lines = new Lines();

const process = async (line: Line, dir: string) => {
  line.text = `${ansi.style.cyan}${dir}${ansi.style.reset}`;

  // branch
  line.mark(Line.word(Line.green('loading branch...')));
  try {
    const { stdout } = await execPromise('git branch --show-current', { cwd: dir });
    const branch = stdout.trim();
    line.clear(Line.word(branch));
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

  // clean
  line.mark(Line.word(Line.green('getting status...')));
  try {
    const { stdout } = await execPromise('git status --porcelain', { cwd: dir });
    if (stdout.trim().length === 0) {
      line.clear(Line.word('clean'));
    } else {
      line.clear(Line.word('dirty'));
      return;
    }
  } catch (x) {
    line.append(Line.word(Line.red(x)));
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
  .catch(err => (lines.last.text = Line.red(err)));
