const big = require('./bignumber-util');

let globalOptions = {};
let globalParseOptions = {};
let classHandlers = [];
const handlerMap = new Map();

const dateHandler = {
  test: obj => obj instanceof Date,
  name: 'date',
  creator: date => new Date(date),
  serializer: date => date.toISOString(),
};

const bigIntHandler = {
  test: (obj, expandedNumbers) => !expandedNumbers && big.isBigInt(obj),
  name: 'bigint',
  creator: big.toBigInt,
  serializer: n => big.stringify(n, true, true, '', true),
};

const bigDecimalHandler = {
  test: (obj, expandedNumbers) => !expandedNumbers && big.isBigDecimal(obj),
  name: 'bigdecimal',
  creator: big.toBigDecimal,
  serializer: n => big.stringify(n, true, true, '', true),
};

module.exports = {
  setOptions(options) {
    Object.assign(globalOptions, options || {});
  },

  resetOptions() {
    globalOptions = {};
    Object.assign(globalOptions, module.exports.defaultOptions);
  },

  getOptions() {
    return globalOptions;
  },

  Quote: {
    DOUBLE: 0,
    SINGLE: 1,
    PREFER_DOUBLE: 2,
    PREFER_SINGLE: 3,
  },

  defaultOptions: {
    classPrefix: '_',
    expandedClasses: false,
    expandedNumbers: false,
    expandedPrimitives: false,
    expandedValues: false,
    quote: 0,
    quoteAllKeys: true,
    // replacer
    space: 0,
    sparseArrays: false,
    trailingComma: false,
  },

  setParseOptions(options) {
    Object.assign(globalParseOptions, options || {});
  },

  resetParseOptions() {
    globalParseOptions = {};
    Object.assign(globalParseOptions, module.exports.defaultParseOptions);
  },

  getParseOptions() {
    return globalParseOptions;
  },

  defaultParseOptions: {
    keySuffixClasses: false,
  },

  addClassHandler(handler) {
    let handlerIndex = -1;

    if (handlerMap.has(handler.name)) {
      handlerIndex = classHandlers.findIndex(h => h.name === handler.name);
    }

    handlerMap.set(handler.name, handler);

    if (handlerIndex < 0) {
      classHandlers.push(handler);
    }
    else {
      classHandlers[handlerIndex] = handler;
    }
  },

  removeClassHandler(name) {
    if (handlerMap.has(name)) {
      const handlerIndex = classHandlers.findIndex(h => h.name === name);

      if (handlerIndex >= 0) {
        classHandlers.splice(handlerIndex, 1);
      }

      handlerMap.delete(name);
    }
  },

  restoreStandardClassHandlers() {
    module.exports.addClassHandler(dateHandler);
    module.exports.addClassHandler(bigIntHandler);
    module.exports.addClassHandler(bigDecimalHandler);
  },

  resetStandardClassHandlers() {
    classHandlers = [];
    handlerMap.clear();
    module.exports.restoreStandardClassHandlers();
  },

  stringifyAsFunctionValue(value, prefix, quoteFunction, expandedNumbers) {
    // Scan handlers in reverse order so that the most recently added have priority.
    for (let i = classHandlers.length - 1; i >= 0; --i) {
      const handler = classHandlers[i];

      if (handler.test(value, expandedNumbers)) {
        return prefix + handler.name + '(' + quoteFunction(handler.serializer(value)) + ')';
      }
    }

    return undefined;
  },
};

Object.freeze(module.exports.defaultOptions);
module.exports.resetOptions();

Object.freeze(module.exports.defaultParseOptions);
module.exports.resetParseOptions();

module.exports.resetStandardClassHandlers();
