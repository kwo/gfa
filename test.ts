import { Line } from './lines';

const line = new Line();
line.append('hello');
console.log(`line: *${line.text}*`);

line.mark();

line.append('.');
console.log(`line: *${line.text}*`);
line.append('.');
console.log(`line: *${line.text}*`);
line.append('.');
console.log(`line: *${line.text}*`);

line.clear();
console.log(`line: *${line.text}*`);

line.append(Line.word('world'));
console.log(`line: *${line.text}*`);

line.mark();

line.append('.');
console.log(`line: *${line.text}*`);
line.append('.');
console.log(`line: *${line.text}*`);
line.append('.');
console.log(`line: *${line.text}*`);

line.clear();
console.log(`line: *${line.text}*`);
