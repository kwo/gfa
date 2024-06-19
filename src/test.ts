import { Line } from './lines.ts';

const xyz = () => {
  // const text = '* main 087a490 [origin/main: ahead 1] check that origin';
  // const text = '* main 7ece297 change project to cli-only';
  const text =
    '* main 087a490 [origin/main: ahead 1] check that origin is available before fetching, pulling';

  //  * main   9378548 [origin/main] update readme
  //  * main 7ece297 change project to cli-only
  // * main 087a490 [origin/main: ahead 1] check that origin is available before fetching, pulling

  if (!text.startsWith('*')) {
    console.log('not the current branch, ignoring.');
    return;
  }

  // look for brackets
  // if found, get name of remote branch
  const posBracket1 = text.indexOf('[');
  if (posBracket1 === -1) {
    console.log('no remote branch');
    return;
  }

  const posBracket2 = text.indexOf(']');
  if (posBracket2 === -1) {
    console.log('parse error - no closing bracket');
    return;
  }

  const remoteInfo = text.substring(posBracket1 + 1, posBracket2);
  const remoteParts = remoteInfo.split(': ', 2);
  const remoteBranch = remoteParts[0];
  console.log(`*${remoteBranch}*`);
  if (remoteParts.length !== 2) {
    return;
  }
  const remoteStatus = remoteParts[1];
  console.log(`*${remoteStatus}*`);
};

interface RemoteBranchStatus {
  branch: string;
  status: string;
}

const xyz2 = (text: string): RemoteBranchStatus | null => {
  if (!text.startsWith('*')) {
    // console.log('not the current branch, ignoring.');
    return null;
  }

  const match = text.match(/\[\s*([^:]+)(:\s(.+)\s*)?\]/);
  if (!match) {
    // console.log('no remote branch');
    return null;
  }

  const [, branch, , status] = match;
  return { branch, status };
};

const xyz0 = () => {
  const texts: string[] = [
    '* main 087a490 [origin/main: ahead 1] check that origin',
    '* main 7ece297 change project to cli-only',
    '* main bd9727f [origin/main: behind 3] Merge pull request #157',
    '* rust   8fa6841 add examples',
    '* main   9378548 [origin/main] update readme',
    '* main 4bf0551 [origin/main: ahead 1, behind 3] update readme',
  ];

  for (const text of texts) {
    console.log(xyz2(text));
  }
};

const foo = () => {
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
};

xyz0();
