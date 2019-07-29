const big = require('./bignumber-util');

let globalOptions = {};
let globalParseOptions = {};
let typeHandlers = [];
const handlerMap = new Map();

const Quote = {
  DOUBLE: 0,
  SINGLE: 1,
  PREFER_DOUBLE: 2,
  PREFER_SINGLE: 3,
};

const Options = {
  MAX_COMPATIBILITY: 0,
  MODERATE: 1,
  THE_WORKS: 2,
};

const compatibleOptions = {
  expandedPrimitives: false,
  expandedTypes: false,
  primitiveBigDecimal: false,
  primitiveBigInt: false,
  quote: Quote.DOUBLE,
  quoteAllKeys: true,
  // replacer
  space: 0,
  sparseArrays: false,
  trailingComma: false,
  typePrefix: '_',
};

const moderateOptions = {
  expandedPrimitives: true,
  expandedTypes: false,
  primitiveBigDecimal: false,
  primitiveBigInt: true,
  quote: Quote.PREFER_SINGLE,
  quoteAllKeys: false,
  // replacer
  space: 0,
  sparseArrays: true,
  trailingComma: true,
  typePrefix: '_',
};

const theWorks = {
  expandedPrimitives: true,
  expandedTypes: true,
  primitiveBigDecimal: true,
  primitiveBigInt: true,
  quote: Quote.PREFER_SINGLE,
  quoteAllKeys: false,
  // replacer
  space: 0,
  sparseArrays: true,
  trailingComma: true,
  typePrefix: '_',
};

const dateHandler = {
  test: obj => obj instanceof Date,
  name: 'date',
  creator: date => new Date(date),
  serializer: date => date.toISOString(),
};

const bigIntHandler = {
  test: (obj, options) => !options.primitiveBigInt && big.isBigInt(obj),
  name: 'bigint',
  creator: big.toBigInt,
  serializer: n => big.stringify(n, {primitiveBigInt: true}, '', true),
};

const bigDecimalHandler = {
  test: (obj, options) => !options.primitiveBigDecimal && big.isBigDecimal(obj),
  name: 'bigdecimal',
  creator: big.toBigDecimal,
  serializer: n => big.stringify(n, {primitiveBigDecimal: true}, '', true),
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

  Quote,

  Options,

  defaultOptions: compatibleOptions,

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
    reviveTypedContainers: false,
  },

  addTypeHandler(handler) {
    let handlerIndex = -1;

    if (handlerMap.has(handler.name)) {
      handlerIndex = typeHandlers.findIndex(h => h.name === handler.name);
    }

    handlerMap.set(handler.name, handler);

    if (handlerIndex < 0) {
      typeHandlers.push(handler);
    }
    else {
      typeHandlers[handlerIndex] = handler;
    }
  },

  removeTypeHandler(name) {
    if (handlerMap.has(name)) {
      const handlerIndex = typeHandlers.findIndex(h => h.name === name);

      if (handlerIndex >= 0) {
        typeHandlers.splice(handlerIndex, 1);
      }

      handlerMap.delete(name);
    }
  },

  restoreStandardTypeHandlers() {
    module.exports.addTypeHandler(dateHandler);
    module.exports.addTypeHandler(bigIntHandler);
    module.exports.addTypeHandler(bigDecimalHandler);
  },

  resetStandardTypeHandlers() {
    typeHandlers = [];
    handlerMap.clear();
    module.exports.restoreStandardTypeHandlers();
  },

  stringifyAsExtendedType(value, options, quoteFunction) {
    // Scan handlers in reverse order so that the most recently added have priority.
    for (let i = typeHandlers.length - 1; i >= 0; --i) {
      const handler = typeHandlers[i];

      if (handler.test(value, options)) {
        return `${options.typePrefix}${handler.name}(${quoteFunction(handler.serializer(value))})`;
      }
    }

    return undefined;
  },

  reviveTypeValue(typeName, value) {
    const handler = handlerMap.get(typeName);

    if (handler) {
      return handler.creator(value);
    }

    return undefined;
  },
};

Object.freeze(compatibleOptions);
Object.freeze(moderateOptions);
Object.freeze(theWorks);
module.exports.resetOptions();

Object.freeze(module.exports.defaultParseOptions);
module.exports.resetParseOptions();

module.exports.resetStandardTypeHandlers();
