const { compileFunc } = require('@ton-community/func-js');
const fs = require('fs');

const stdlib = fs.readFileSync(
  'D:/openclaw-tools/ion-dex-nuke/contracts/ion/node_modules/@ston-fi/funcbox/contracts/stdlib.fc',
  'utf8'
);

const sources = {
  'test.fc': '#pragma version >=0.4.4;\n#include "imports/autoload.fc";\n() main() { ;; }',
  'imports/autoload.fc': '#include "stdlib.fc";',
  'imports/stdlib.fc': stdlib,
};

compileFunc({ targets: ['test.fc'], sources }).then(r => {
  console.log(r.status === 'ok' ? 'STDLIB OK' : 'STDLIB FAIL: ' + r.message.slice(0, 300));
});
