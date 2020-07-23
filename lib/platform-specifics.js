// Note: This file is excluded from coverage reporting because many branches are inaccessible when
// running under older versions of JavaScript that do not support BigInt. All such conditionally
// accessible code has been isolated here.

let hasGlobal = false;
let topLevel;
let fromBase64;
let toBase64;

try {
  hasGlobal = !!global;
  topLevel = global;
  fromBase64 = base64 => new Uint8Array(Buffer.from(base64, 'base64'));
  toBase64 = array => Buffer.from(array).toString('base64');
}
catch (err) {}

let hasWindow = false;

try {
  hasWindow = !!window;
  topLevel = window;
  fromBase64 = base64 => new Uint8Array(atob(base64).split('').map(char => char.charCodeAt(0))); // eslint-disable-line no-undef
  toBase64 = array => btoa(String.fromCharCode(...array)); // eslint-disable-line no-undef
}
catch (err) {}

const nativeBigInt = (hasGlobal && global.BigInt) || (hasWindow && window.BigInt);

const uint8ArrayHandler = {
  name: 'Uint8Array',
  test: obj => (obj instanceof Uint8Array) || (obj instanceof Uint8ClampedArray),
  creator: fromBase64,
  serializer: toBase64,
};

const handlerKeys = [];

module.exports = {
  getNativeBigInt() { return nativeBigInt; },

  /* eslint-disable new-cap */
  toBigInt(bigInt, s) {
    if (bigInt) {
      if (bigInt === nativeBigInt) {
        return bigInt(s);
      }
      else if (typeof s === 'number') {
        const n = bigInt(s);

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

        return n;
      }
    }

    return Number(s);
  },

  toBigDecimal(bigDecimal, s) {
    if (bigDecimal) {
      let n = bigDecimal.constructor ? new bigDecimal(s) : bigDecimal(s);

      if (n === undefined) {
        n = bigDecimal(s);
      }

      return n;
    }

    return Number(s);
  },

  toFixedBigDecimal(fixedBigDecimal, s) {
    if (fixedBigDecimal) {
      let n = fixedBigDecimal.constructor ? new fixedBigDecimal(s) : fixedBigDecimal(s);

      if (n === undefined) {
        n = fixedBigDecimal(s);
      }

      if (typeof fixedBigDecimal.precision === 'number' && typeof n.toDecimalPlaces === 'function') {
        n = n.toDecimalPlaces(fixedBigDecimal.precision);
      }

      return n;
    }

    return Number(s);
  },

  globalizeTypeHandlers(typeHandlers, prefix) {
    module.exports.removeGlobalizedTypeHandlers();

    if (topLevel) {
      if (!prefix) {
        prefix = '_';
      }

      typeHandlers.forEach(handler => {
        const key = prefix + handler.name;

        topLevel[key] = handler.creator;
        handlerKeys.push(key);
      });
    }
  },

  removeGlobalizedTypeHandlers() {
    if (topLevel) {
      let key;

      while ((key = handlerKeys.pop())) {
        delete topLevel[key];
      }
    }
  },

  uint8ArrayHandler,
};
