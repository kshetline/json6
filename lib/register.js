const fs = require('fs');
const JSON6 = require('./');

// eslint-disable-next-line node/no-deprecated-api
require.extensions['.json6'] = function (module, filename) {
  const content = fs.readFileSync(filename, 'utf8');
  try {
    module.exports = JSON6.parse(content);
  }
  catch (err) {
    err.message = filename + ': ' + err.message;
    throw err;
  }
};
