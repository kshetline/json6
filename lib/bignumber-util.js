// Note: This file is excluded from coverage reporting because many branches are inaccessible when
// running under older versions of JavaScript that do not support BigInt. All such conditionally
// accessible code has been isolated here.

let hasGlobal = false;

try {
  hasGlobal = !!global;
}
catch (err) {}

let hasWindow = false;

try {
  hasWindow = !!window;
}
catch (err) {}

let bigInt = (hasGlobal && global.BigInt) || (hasWindow && window.BigInt);
let hasBigInt = !!bigInt;
let bigDecimal;
let hasBigDecimal = false;
let bigDecimalEquals;

module.exports = {
  bigInt,

  hasBigInt,

  hasBigDecimal,

  getBigIntType() { return hasBigInt ? 'bigint' : 'numeric'; },

  getBigDecimalType() { return hasBigDecimal ? 'bigdecimal' : 'numeric'; },

  setBigDecimal(bigDecimalClass, bigDecimalEqualityTest) {
    hasBigDecimal = !!bigDecimalClass;
    bigDecimal = bigDecimalClass;
    bigDecimalEquals = bigDecimalEqualityTest;
  },

  toBigInt(s) {
    return bigInt ? bigInt(s) : Number(s);
  },

  toBigDecimal(s) {
    return bigDecimal ? bigDecimal(s) : Number(s);
  },

  equalBigDecimal(a, b) {
    if (hasBigDecimal && bigDecimalEquals) {
      return bigDecimalEquals(a, b);
    }
    else {
      return a === b;
    }
  },

  isNumberOrBigNumberInstance(value) {
    return value instanceof Number || (hasBigInt && value instanceof bigInt) || (hasBigDecimal && value instanceof bigDecimal);
  },

  isBigNumberInstance(value) {
    return (hasBigInt && value instanceof bigInt) || (hasBigDecimal && value instanceof bigDecimal);
  },

  isNumberOrBigNumber(value) {
    // eslint-disable-next-line valid-typeof
    return typeof value === 'number' || typeof value === 'bigint' || (hasBigDecimal && value instanceof bigDecimal);
  },

  stringify(value) {
    // eslint-disable-next-line valid-typeof
    return String(value) + (typeof value === 'bigint' ? 'n' : '');
  },
};
