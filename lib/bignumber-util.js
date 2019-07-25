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

/* eslint-disable new-cap */
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
    if (bigInt) {
      if (bigInt === nativeBigInt) {
        return bigInt.constructor ? new bigInt(s) : bigInt(s);
      }
      else if (typeof s === 'number') {
        const n = bigInt(s);
        // Defeat any method that might cause this to be converted to a string.
        n.toJSON = undefined;
        return n;
      }
      else {
        let radix = 10;
        const $ = /^([-+]?)0([xob])(.+)$/.exec(s.toLowerCase());

        if ($) {
          s = $[1] + $[3];
          radix = [16, 8, 2]['xob'.indexOf($[2])];
        }

        const n = bigInt.constructor ? new bigInt(s, radix) : new bigInt(s, radix);
        // Defeat any method that might cause this to be converted to a string.
        n.toJSON = undefined;
        return n;
      }
    }

    return Number(s);
  },

  toBigDecimal(s) {
    if (bigDecimal) {
      const n = bigDecimal.constructor ? new bigDecimal(s) : bigDecimal(s);
      // Defeat any method that might cause this to be converted to a string.
      n.toJSON = undefined;
      return n;
    }

    return Number(s);
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

  isNumberOrBigNumber(value) {
    return typeof value === 'number' || value instanceof Number || isBigNumber(value);
  },

  stringify(value) {
    // TODO: Try to preserve negative zero.
    if (value instanceof Number) {
      value = value.valueOf();
    }

    return String(value) + (isBigInt(value) ? 'n' : (isBigDecimal(value) ? 'd' : ''));
  },
};
