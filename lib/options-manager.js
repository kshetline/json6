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

const OptionSet = {
  MAX_COMPATIBILITY: 0,
  RELAXED: 1,
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

const relaxedOptions = {
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
  name: 'date',
  test: obj => obj instanceof Date,
  creator: date => new Date(date),
  serializer: date => date.toISOString(),
};

const bigIntHandler = {
  name: 'bigint',
  test: (obj, options) => !options.primitiveBigInt && big.isBigInt(obj),
  creator: big.toBigInt,
  serializer: n => big.stringify(n, {primitiveBigInt: true}, '', true),
};

const bigDecimalHandler = {
  name: 'bigdecimal',
  test: (obj, options) => !options.primitiveBigDecimal && big.isBigDecimal(obj),
  creator: big.toBigDecimal,
  serializer: n => big.stringify(n, {primitiveBigDecimal: true}, '', true),
};

module.exports = {
  setOptions(options, extraOptions) {
    if (typeof options === 'number') {
      globalOptions = {};

      switch (options) {
        case OptionSet.MAX_COMPATIBILITY: options = compatibleOptions; break;
        case OptionSet.RELAXED: options = relaxedOptions; break;
        case OptionSet.THE_WORKS: options = theWorks; break;
      }
    }
    else {
      extraOptions = undefined;
    }

    Object.assign(globalOptions, options || {});

    if (extraOptions) {
      Object.assign(globalOptions, extraOptions);
    }
  },

  resetOptions() {
    globalOptions = {};
    Object.assign(globalOptions, module.exports.defaultOptions);
  },

  getOptions() {
    return globalOptions;
  },

  Quote,

  OptionSet,

  defaultOptions: compatibleOptions,

  // setParseOptions(options) {
  //   Object.assign(globalParseOptions, options || {});
  // },

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
    // Remove any samed-named handler. The new handler will go on the end, gaining priority.
    module.exports.removeTypeHandler(handler.name);
    handlerMap.set(handler.name, handler);
    typeHandlers.push(handler);
  },

  removeTypeHandler(name) {
    if (handlerMap.has(name)) {
      const handlerIndex = typeHandlers.findIndex(h => h.name === name);

      typeHandlers.splice(handlerIndex, 1);
      handlerMap.delete(name);
    }
  },

  resetStandardTypeHandlers() {
    typeHandlers = [];
    handlerMap.clear();
    module.exports.restoreStandardTypeHandlers();
  },

  restoreStandardTypeHandlers() {
    module.exports.addTypeHandler(dateHandler);
    module.exports.addTypeHandler(bigIntHandler);
    module.exports.addTypeHandler(bigDecimalHandler);
  },

  stringifyAsExtendedType(value, options, quoteFunction) {
    // Scan handlers in reverse order so that the most recently added have priority.
    for (let i = typeHandlers.length - 1; i >= 0; --i) {
      const handler = typeHandlers[i];

      if (handler.test(value, options)) {
        let argValue = handler.serializer(value, options);

        if (typeof argValue === 'string') {
          argValue = quoteFunction(argValue);
        }

        return `${options.typePrefix}${handler.name}(${argValue})`;
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
Object.freeze(relaxedOptions);
Object.freeze(theWorks);
module.exports.resetOptions();

Object.freeze(module.exports.defaultParseOptions);
module.exports.resetParseOptions();

module.exports.resetStandardTypeHandlers();
