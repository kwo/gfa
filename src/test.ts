interface RemoteBranchStatus {
  branch: string;
  status: string;
}

const xyz2 = (text: string): RemoteBranchStatus | null => {
  if (!text.startsWith('*')) {
    // console.log('not the current branch, ignoring.');
    return null;
  }

  const match = /\[\s*([^:]+)(:\s(.+)\s*)?\]/.exec(text);
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

xyz0();
