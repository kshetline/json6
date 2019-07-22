// Note: This file is excluded from coverage reporting because many branches are inaccessible when
// running under older versions of JavaScript that do not support BigInt. All such conditionally
// accessible code has been isolated here.

var hasGlobal = false;

try {
  hasGlobal = !!global;
}
catch (err) {}

var hasWindow = false;

try {
  hasWindow = !!window;
}
catch (err) {}

var bigInt = (hasGlobal && global.BigInt) || (hasWindow && window.BigInt);
var hasBigInt = !!bigInt;

module.exports = {
  bigInt,

  hasBigInt,

  bigIntType: hasBigInt ? 'bigint' : 'numeric',

  toBigInt(s) {
    return bigInt ? bigInt(s) : Number(s);
  },

  isNumberOrBigIntInstance(value) {
    return value instanceof Number || (hasBigInt && value instanceof bigInt);
  },

  isNumberOrBigInt(value) {
    // eslint-disable-next-line valid-typeof
    return typeof value === 'number' || typeof value === 'bigint';
  },

  stringify(value) {
    // eslint-disable-next-line valid-typeof
    return String(value) + (typeof value === 'bigint' ? 'n' : '');
  },
};
