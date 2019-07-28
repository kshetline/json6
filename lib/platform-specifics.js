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

const nativeBigInt = (hasGlobal && global.BigInt) || (hasWindow && window.BigInt);

module.exports = {
  getNativeBigInt() { return nativeBigInt; },

  /* eslint-disable new-cap */
  toBigInt(bigInt, s) {
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

  toBigDecimal(bigDecimal, s) {
    if (bigDecimal) {
      const n = bigDecimal.constructor ? new bigDecimal(s) : bigDecimal(s);
      // Defeat any method that might cause this to be converted to a string.
      n.toJSON = undefined;
      return n;
    }

    return Number(s);
  },
};
