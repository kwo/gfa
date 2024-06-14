import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import ansi from 'ansi-escape-sequences';

const execPromise = promisify(exec);
const lines: string[] = [];
let linesUpdatedOnce: boolean = false;

function updateLines() {
  if (linesUpdatedOnce) {
    console.log(ansi.cursor.previousLine(lines.length+1));
  }
  linesUpdatedOnce = true;
  // console.log(ansi.erase.lines(lines.length));
  console.log(lines.join('\n'));
}

function updateLine(lineNumber: number, newText: string) {
  lines[lineNumber] = newText;
  updateLines();
}

function appendToLine(lineNumber: number, extraText: string) {
  const newText = `${lines[lineNumber]} ${extraText}`;
  updateLine(lineNumber, newText);
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
  dirents
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .forEach(async (subdirName, i) => {
      lines.push('');
      updateLine(i, `${ansi.style.cyan}${subdirName}${ansi.style.reset}`);
      await process(i, subdirName);
    });
}

main('.')
  .then(() => console.log('done'))
  .catch(err => console.error(err));
