const fs = require('fs');
const JSONZ = require('./');

// eslint-disable-next-line node/no-deprecated-api
require.extensions['.jsonz'] = function (module, filename) {
  const content = fs.readFileSync(filename, 'utf8');
  try {
    module.exports = JSONZ.parse(content);
  }
  catch (err) {
    err.message = filename + ': ' + err.message;
    throw err;
  }
};
