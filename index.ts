const ansi = require('ansi-escape-sequences');

console.log(ansi.style.brightCyan + 'Hello via Bun!' + ansi.style.reset);
