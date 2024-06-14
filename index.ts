import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import ansi from 'ansi-escape-sequences';

const execPromise = promisify(exec);
const lines: string[] = [];
let linesUpdatedOnce: boolean = false;

function updateLines() {
  if (linesUpdatedOnce) {
    console.log(ansi.cursor.previousLine(lines.length + 1));
  }
  linesUpdatedOnce = true;
  console.log(lines.join('\n'));
}

function updateLine(lineNumber: number, text: string) {
  lines[lineNumber] = text;
  updateLines();
}

function appendToLine(lineNumber: number, addedText: string) {
  const text = `${lines[lineNumber]}${addedText}`;
  updateLine(lineNumber, text);
}

async function process(lineNumber: number, dir: string) {
  // branch
  try {
    const { stdout } = await execPromise('git branch --show-current', { cwd: dir });
    const branch = stdout.trim();
    appendToLine(lineNumber, branch);
  } catch (x) {
    appendToLine(lineNumber, `${ansi.style.red}${x}${ansi.style.reset}`);
    return;
  }
}

async function main(dir: string) {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const subdirs = dirents.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);

  subdirs.forEach((subdirName, i) => {
    lines.push('');
    updateLine(i, `${ansi.style.cyan}${subdirName}${ansi.style.reset}`);
  });

  subdirs.forEach(async (subdirName, i) => {
    await process(i, subdirName);
  });
}

main('.')
  .then(() => console.log('done'))
  .catch(err => console.error(err));
