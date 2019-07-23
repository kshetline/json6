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
const nativeBigInt = bigInt;
let hasBigInt = !!bigInt;
const hasNativeBigInt = hasBigInt;
let bigIntEquals;

let bigDecimal;
let hasBigDecimal = false;
let bigDecimalEquals;

function isBigInt(value) {
  // eslint-disable-next-line valid-typeof
  return typeof value === 'bigint' || (hasBigInt && value instanceof bigInt);
}

function isBigDecimal(value) {
  return hasBigDecimal && value instanceof bigDecimal;
}

function isBigNumber(value) {
  return isBigInt(value) || isBigDecimal(value);
}

module.exports = {
  hasBigInt() { return hasBigInt; },

  hasNativeBigInt() { return hasNativeBigInt; },

  hasBigDecimal() { return hasBigDecimal; },

  getBigIntType() { return hasBigInt ? 'bigint' : 'numeric'; },

  getBigDecimalType() { return hasBigDecimal ? 'bigdecimal' : 'numeric'; },

  setBigInt(bigIntClass, bigIntEqualityTest) {
    if (bigIntClass === true) {
      hasBigInt = !!nativeBigInt;
      bigInt = nativeBigInt;
      bigIntEquals = undefined;
    }
    else {
      hasBigInt = !!bigIntClass;
      bigInt = bigIntClass;
      bigIntEquals = bigIntEqualityTest;
    }
  },

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

  equalBigInt(a, b) {
    if (a === b) {
      return true;
    }
    else if (!!a !== !!b || !a) {
      return false;
    }
    else if (hasBigInt && bigIntEquals) {
      return bigIntEquals(a, b);
    }
    else if (typeof a.equals === 'function') {
      return a.equals(b);
    }
    else if (typeof a.compare === 'function') {
      return a.compare(b) === 0;
    }
    else if (typeof a.comparedTo === 'function') {
      return a.comparedTo(b) === 0;
    }
    else {
      return undefined;
    }
  },

  equalBigDecimal(a, b) {
    if (a === b) {
      return true;
    }
    else if (!!a !== !!b || !a) {
      return false;
    }
    else if (hasBigDecimal && bigDecimalEquals) {
      return bigDecimalEquals(a, b);
    }
    else if (typeof a.equals === 'function') {
      return a.equals(b);
    }
    else if (typeof a.compare === 'function') {
      return a.compare(b) === 0;
    }
    else if (typeof a.comparedTo === 'function') {
      return a.comparedTo(b) === 0;
    }
    else {
      return undefined;
    }
  },

  isBigInt,

  isBigDecimal,

  isBigNumber,

  isNumberOrBigNumberInstance(value) {
    return value instanceof Number || isBigNumber(value);
  },

  isBigNumberInstance(value) {
    return isBigNumber(value);
  },

  isNumberOrBigNumber(value) {
    // eslint-disable-next-line valid-typeof
    return typeof value === 'number' || isBigNumber(value);
  },

  stringify(value) {
    // eslint-disable-next-line valid-typeof
    return String(value) + (isBigInt(value) ? 'n' : (isBigDecimal(value) ? 'd' : ''));
  },
};
