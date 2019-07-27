let globalOptions = {};

module.exports = {
  setOptions(options) {
    Object.assign(globalOptions, options || {});
  },

  resetOptions() {
    globalOptions = {};
    Object.assign(globalOptions, module.exports.defaultOptions);
  },

  getOptions() {
    return globalOptions || {};
  },

  Quote: {
    DOUBLE: 0,
    SINGLE: 1,
    PREFER_DOUBLE: 2,
    PREFER_SINGLE: 3,
  },

  defaultOptions: {
    addTrailingComma: false,
    quote: 0,
    quoteAllKeys: true,
    // replacer
    space: 0,
  },
};

Object.freeze(module.exports.defaultOptions);
module.exports.resetOptions();
