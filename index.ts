import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import ansi from 'ansi-escape-sequences';
const execPromise = promisify(exec);

const lines: string[] = [];
let linesUpdatedOnce: boolean = false;

const updateLines = () => {
  if (linesUpdatedOnce) {
    console.log(ansi.cursor.previousLine(lines.length + 1));
  }
  linesUpdatedOnce = true;
  for (const line of lines) {
    console.log(`${ansi.erase.inLine(0)}${line}`);
  }
};

const updateLine = (lineNumber: number, text: string) => {
  lines[lineNumber] = text;
  updateLines();
};

const appendToLine = (lineNumber: number, addedText: string) => {
  const text = `${lines[lineNumber]}${addedText}`;
  updateLine(lineNumber, text);
};

// set the text of the last line
const updateStatus = (text: string) => {
  updateLine(lines.length - 1, text);
};

const process = async (lineNumber: number, dir: string) => {
  // branch
  try {
    const { stdout } = await execPromise('git branch --show-current', { cwd: dir });
    const branch = stdout.trim();
    appendToLine(lineNumber, ` ${branch}`);
  } catch (x) {
    appendToLine(lineNumber, ` ${ansi.style.red}${x}${ansi.style.reset}`);
    return;
  }

  // fetch
  try {
    await execPromise('git fetch --all --tags --prune --prune-tags --quiet', { cwd: dir });
    appendToLine(lineNumber, ' fetched');
  } catch (x) {
    appendToLine(lineNumber, ` ${ansi.style.red}${x}${ansi.style.reset}`);
    return;
  }

  // clean
  try {
    const { stdout } = await execPromise('git status --porcelain', { cwd: dir });
    if (stdout.trim().length === 0) {
      appendToLine(lineNumber, ' clean');
    } else {
      appendToLine(lineNumber, ' dirty');
      return;
    }
  } catch (x) {
    appendToLine(lineNumber, ` ${ansi.style.red}${x}${ansi.style.reset}`);
    return;
  }

  // pull
  try {
    await execPromise('git pull', { cwd: dir });
    appendToLine(lineNumber, ' pulled');
  } catch (x) {
    appendToLine(lineNumber, ` ${ansi.style.red}${x}${ansi.style.reset}`);
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
  subdirs.forEach(subdirName => {
    lines.push(`${ansi.style.cyan}${subdirName}${ansi.style.reset}`);
  });
  lines.push(''); // last line is status

  // launch processes
  updateStatus('working...');
  const promises: Promise<void>[] = [];
  subdirs.forEach((subdirName, i) => {
    promises.push(process(i, subdirName));
  });
  return Promise.all(promises);
};

main('.')
  .then(() => updateStatus('done'))
  .catch(err => updateStatus(err));
