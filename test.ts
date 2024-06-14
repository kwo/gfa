import ansi from 'ansi-escape-sequences';

const lines: string[] = [];
let linesUpdatedOnce: boolean = false;

function updateLines() {
  if (linesUpdatedOnce) {
    console.log(ansi.cursor.previousLine(lines.length + 1));
  }
  linesUpdatedOnce = true;
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

for (let i = 0; i < 10; i++) {
  lines.push(`Line ${i}`);
}

setInterval(() => {
  appendToLine(0, '*');
  appendToLine(2, '*');
  appendToLine(4, '*');
  appendToLine(6, '*');
  appendToLine(8, '*');

  appendToLine(1, '+');
  appendToLine(3, '+');
  appendToLine(5, '+');
  appendToLine(7, '+');
  appendToLine(9, '+');
}, 1000);

await new Promise(function () {});
