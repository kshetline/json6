const fs = require('fs');
const path = require('path');

const JSONZ = require('../lib');

const pkg = require('../package.json');

let pkg5 = '// This is a generated file. Do not edit.\n';
pkg5 += pkg5 = JSONZ.stringify(pkg, null, 2);

fs.writeFileSync(path.resolve(__dirname, '..', 'package.jsonz'), pkg5);
