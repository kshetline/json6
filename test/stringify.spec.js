/* eslint-disable no-new-wrappers */
const assert = require('assert');
const JSONZ = require('../lib');
const big = require('../lib/bignumber-util');
const bigInt = require('big-integer');
const Decimal = require('decimal.js');

JSONZ.setBigInt(bigInt);
JSONZ.setBigDecimal(Decimal);
JSONZ.setOptions({
  expandedPrimitives: true,
  quote: JSONZ.Quote.PREFER_SINGLE,
  quoteAllKeys: false,
  sparseArrays: true,
});

require('tap').mochaGlobals();

describe('JSONZ', () => {
  describe('#stringify', () => {
    describe('objects', () => {
      it('stringifies empty objects', () => {
        assert.strictEqual(JSONZ.stringify({}), '{}');
      });

      it('stringifies unquoted property names', () => {
        assert.strictEqual(JSONZ.stringify({a: 1}), '{a:1}');
      });

      it('stringifies single quoted string property names', () => {
        assert.strictEqual(JSONZ.stringify({'a-b': 1}), "{'a-b':1}");
      });

      it('stringifies double quoted string property names', () => {
        assert.strictEqual(JSONZ.stringify({"a'": 1}), `{"a'":1}`);
      });

      it('stringifies empty string property names', () => {
        assert.strictEqual(JSONZ.stringify({'': 1}), "{'':1}");
      });

      it('stringifies special character property names', () => {
        assert.strictEqual(JSONZ.stringify({$_: 1, _$: 2, 'a\u200C': 3}), '{$_:1,_$:2,a\u200C:3}');
      });

      it('stringifies unicode property names', () => {
        // noinspection NonAsciiCharacters
        assert.strictEqual(JSONZ.stringify({'ùńîċõďë': 9}), '{ùńîċõďë:9}');
      });

      it('stringifies escaped property names', () => {
        assert.strictEqual(JSONZ.stringify({'\\\b\f\n\r\t\v\0\x01': 1}), "{'\\\\\\b\\f\\n\\r\\t\\v\\0\\x01':1}");
      });

      it('stringifies multiple properties', () => {
        assert.strictEqual(JSONZ.stringify({abc: 1, def: 2}), '{abc:1,def:2}');
      });

      it('stringifies nested objects', () => {
        assert.strictEqual(JSONZ.stringify({a: {b: 2}}), '{a:{b:2}}');
      });

      it('stringifies undefined', () => {
        assert.strictEqual(JSONZ.stringify(undefined), 'undefined');
        assert.strictEqual(JSONZ.stringify([1, undefined, 3]), '[1,undefined,3]');
        assert.strictEqual(JSONZ.stringify({a: 1, b: undefined, c: 2}), '{a:1,b:undefined,c:2}');
      });
    });

    describe('arrays', () => {
      it('stringifies empty arrays', () => {
        assert.strictEqual(JSONZ.stringify([]), '[]');
      });

      it('stringifies array values', () => {
        assert.strictEqual(JSONZ.stringify([1]), '[1]');
      });

      it('stringifies multiple array values', () => {
        assert.strictEqual(JSONZ.stringify([1, 2]), '[1,2]');
      });

      it('stringifies nested arrays', () => {
        assert.strictEqual(JSONZ.stringify([1, [2, 3]]), '[1,[2,3]]');
      });

      it('stringifies sparse arrays', () => {
        // noinspection JSConsecutiveCommasInArrayLiteral
        assert.strictEqual(JSONZ.stringify([1,, 2]), '[1,,2]'); // eslint-disable-line no-sparse-arrays
      });

      it('stringifies sparse arrays with null for JSON compatibility', () => {
        // noinspection JSConsecutiveCommasInArrayLiteral
        assert.strictEqual(JSONZ.stringify([1,, 2], // eslint-disable-line no-sparse-arrays
          {expandedPrimitives: false, sparseArrays: false}), '[1,null,2]');
      });
    });

    it('stringifies nulls', () => {
      assert.strictEqual(JSONZ.stringify(null), 'null');
    });

    it('returns undefined for functions', () => {
      assert.strictEqual(JSONZ.stringify(() => {}), undefined);
    });

    it('ignores function properties', () => {
      assert.strictEqual(JSONZ.stringify({a() {}}), '{}');
    });

    it('returns null for functions in arrays', () => {
      assert.strictEqual(JSONZ.stringify([() => {}]), '[null]');
    });

    describe('Booleans', () => {
      it('stringifies true', () => {
        assert.strictEqual(JSONZ.stringify(true), 'true');
      });

      it('stringifies false', () => {
        assert.strictEqual(JSONZ.stringify(false), 'false');
      });

      it('stringifies true Boolean objects', () => {
        // eslint-disable-next-line no-new-wrappers
        // noinspection JSPrimitiveTypeWrapperUsage
        assert.strictEqual(JSONZ.stringify(new Boolean(true)), 'true');
      });

      it('stringifies false Boolean objects', () => {
        // eslint-disable-next-line no-new-wrappers
        // noinspection JSPrimitiveTypeWrapperUsage
        assert.strictEqual(JSONZ.stringify(new Boolean(false)), 'false');
      });
    });

    describe('numbers', () => {
      it('stringifies numbers', () => {
        assert.strictEqual(JSONZ.stringify(-1.2), '-1.2');
      });

      it('stringifies non-finite numbers', () => {
        assert.strictEqual(JSONZ.stringify([Infinity, -Infinity, NaN]), '[Infinity,-Infinity,NaN]');
      });

      it('stringifies Number objects', () => {
        // eslint-disable-next-line no-new-wrappers
        // noinspection JSPrimitiveTypeWrapperUsage
        assert.strictEqual(JSONZ.stringify(new Number(-1.2)), '-1.2');
      });
    });

    if (big.hasBigInt()) {
      describe('bigints', () => {
        it('stringifies bigints', () => {
          assert.strictEqual(JSONZ.stringify([big.toBigInt('4081516234268675309')]), '[4081516234268675309n]');
          assert.strictEqual(JSONZ.stringify(big.toBigInt('-4081516234268675309')), '-4081516234268675309n');
        });

        it('stringifies bigint values for standard JSON', () => {
          assert.strictEqual(JSONZ.stringify(
            big.toBigInt('4081516234268675309'),
            {expandedPrimitives: false, quote: JSONZ.Quote.PREFER_DOUBLE}),
          '"4081516234268675309"');
        });
      });
    }

    if (big.hasBigDecimal()) {
      describe('bigdecimals', () => {
        it('stringifies bigdecimals', () => {
          assert.strictEqual(JSONZ.stringify([big.toBigDecimal('3.141592653589793238462643383279')]), '[3.141592653589793238462643383279m]');
          assert.strictEqual(JSONZ.stringify(big.toBigDecimal('-4081516234268675309')), '-4081516234268675309m');
        });

        it('stringifies bigdecimal special values', () => {
          assert.strictEqual(JSONZ.stringify([big.toBigDecimal(1 / 0), big.toBigDecimal(-1 / 0), big.toBigDecimal(0 / 0)]),
            '[Infinity,-Infinity,NaN]');
        });

        it('stringifies bigdecimal values for standard JSON', () => {
          assert.strictEqual(JSONZ.stringify(
            [big.toBigDecimal(1 / 0), big.toBigDecimal(-1 / 0), big.toBigDecimal(0 / 0), big.toBigDecimal('3.14')],
            {expandedPrimitives: false, quote: JSONZ.Quote.PREFER_DOUBLE}),
          '[null,null,null,"3.14"]');
        });
      });
    }

    describe('strings', () => {
      it('stringifies single quoted strings', () => {
        assert.strictEqual(JSONZ.stringify('abc'), "'abc'");
      });

      it('stringifies double quoted strings', () => {
        assert.strictEqual(JSONZ.stringify("abc'"), `"abc'"`);
      });

      it('stringifies escaped characters', () => {
        assert.strictEqual(JSONZ.stringify('\\\b\f\n\r\t\v\0\x0f'), "'\\\\\\b\\f\\n\\r\\t\\v\\0\\x0F'");
      });

      it('stringifies with backtick quoting', () => {
        assert.strictEqual(JSONZ.stringify(`'"`), `\`'"\``);
      });

      it('stringifies escaped single quotes', () => {
        assert.strictEqual(JSONZ.stringify(`\`'"`), '\'`\\\'"\'');
      });

      it('stringifies escaped double quotes', () => {
        assert.strictEqual(JSONZ.stringify(`\`''"`), "\"`''\\\"\"");
      });

      it('stringifies escaped backticks', () => {
        assert.strictEqual(JSONZ.stringify(`\`''""`), `\`\\\`''""\``);
      });

      it('stringifies escaped line and paragraph separators', () => {
        assert.strictEqual(JSONZ.stringify('\u2028\u2029'), "'\\u2028\\u2029'");
      });

      it('stringifies String objects', () => {
        // eslint-disable-next-line no-new-wrappers
        // noinspection JSPrimitiveTypeWrapperUsage
        assert.strictEqual(JSONZ.stringify(new String('abc')), "'abc'");
      });
    });

    it('stringifies using built-in toJSON methods', () => {
      assert.strictEqual(JSONZ.stringify(new Date('2016-01-01T00:00:00.000Z')), "'2016-01-01T00:00:00.000Z'");
    });

    it('stringifies using user defined toJSON methods', () => {
      function C() {}
      Object.assign(C.prototype, {toJSON() { return {a: 1, b: 2}; }});
      assert.strictEqual(JSONZ.stringify(new C()), '{a:1,b:2}');
    });

    it('stringifies using user defined toJSON(key) methods', () => {
      function C() {}
      Object.assign(C.prototype, {toJSON(key) { return (key === 'a') ? 1 : 2; }});
      assert.strictEqual(JSONZ.stringify({a: new C(), b: new C()}), '{a:1,b:2}');
    });

    it('stringifies using toJSONZ methods', () => {
      function C() {}
      Object.assign(C.prototype, {toJSONZ() { return {a: 1, b: 2}; }});
      assert.strictEqual(JSONZ.stringify(new C()), '{a:1,b:2}');
    });

    it('stringifies using toJSONZ(key) methods', () => {
      function C() {}
      Object.assign(C.prototype, {toJSONZ(key) { return (key === 'a') ? 1 : 2; }});
      assert.strictEqual(JSONZ.stringify({a: new C(), b: new C()}), '{a:1,b:2}');
    });

    it('calls toJSONZ instead of toJSON if both are defined', () => {
      function C() {}
      Object.assign(C.prototype, {
        toJSON() { return {a: 1, b: 2}; },
        toJSONZ() { return {a: 2, b: 2}; },
      });
      assert.strictEqual(JSONZ.stringify(new C()), '{a:2,b:2}');
    });

    it('throws on circular objects', () => {
      let a = {};
      a.a = a;
      assert.throws(() => { JSONZ.stringify(a); }, TypeError, 'Converting circular structure to JSONZ');
    });

    it('throws on circular arrays', () => {
      let a = [];
      a[0] = a;
      assert.throws(() => { JSONZ.stringify(a); }, TypeError, 'Converting circular structure to JSONZ');
    });
  });

  describe('#stringify(value, null, space)', () => {
    it('does not indent when no value is provided', () => {
      assert.strictEqual(JSONZ.stringify([1]), '[1]');
    });

    it('does not indent when 0 is provided', () => {
      assert.strictEqual(JSONZ.stringify([1], null, 0), '[1]');
    });

    it('does not indent when an empty string is provided', () => {
      assert.strictEqual(JSONZ.stringify([1], null, ''), '[1]');
    });

    it('does not indent when a single space is provided', () => {
      assert.strictEqual(JSONZ.stringify([1, 2], null, ' '), '[1, 2]');
    });

    it('indents n spaces when a number > 1 is provided', () => {
      assert.strictEqual(JSONZ.stringify([1], null, 2), '[\n  1\n]');
    });

    it('does not indent more than 10 spaces when a number is provided', () => {
      assert.strictEqual(JSONZ.stringify([1], null, 11), '[\n          1\n]');
    });

    it('indents with the string provided', () => {
      assert.strictEqual(JSONZ.stringify([1], null, '\t'), '[\n\t1\n]');
    });

    it('does not indent more than 10 characters of the string provided', () => {
      assert.strictEqual(JSONZ.stringify([1], null, '           '), '[\n          1\n]');
    });

    it('indents in arrays', () => {
      assert.strictEqual(JSONZ.stringify([1], null, 2), '[\n  1\n]');
    });

    it('indents with trailing comma in arrays', () => {
      assert.strictEqual(JSONZ.stringify([1], {trailingComma: true, space: 2}), '[\n  1,\n]');
    });

    it('indents in nested arrays', () => {
      assert.strictEqual(JSONZ.stringify([1, [2], 3], null, 2), '[\n  1,\n  [\n    2\n  ],\n  3\n]');
    });

    it('indents in objects', () => {
      assert.strictEqual(JSONZ.stringify({a: 1}, null, 2), '{\n  a: 1\n}');
    });

    it('indents with trailing comma in objects', () => {
      assert.strictEqual(JSONZ.stringify({a: 1}, {trailingComma: true, space: 2}), '{\n  a: 1,\n}');
    });

    it('indents in nested objects', () => {
      assert.strictEqual(JSONZ.stringify({a: {b: 2}}, null, 2), '{\n  a: {\n    b: 2\n  }\n}');
    });

    it('accepts Number objects', () => {
      // eslint-disable-next-line no-new-wrappers
      // noinspection JSPrimitiveTypeWrapperUsage
      assert.strictEqual(JSONZ.stringify([1], null, new Number(2)), '[\n  1\n]');
    });

    it('accepts String objects', () => {
      // eslint-disable-next-line no-new-wrappers
      // noinspection JSPrimitiveTypeWrapperUsage
      assert.strictEqual(JSONZ.stringify([1], null, new String('\t')), '[\n\t1\n]');
    });
  });

  describe('#stringify(value, replacer)', () => {
    it('filters keys when an array is provided', () => {
      assert.strictEqual(JSONZ.stringify({a: 1, b: 2, 3: 3}, ['a', 3]), "{a:1,'3':3}");
    });

    it('only filters string and number keys when an array is provided', () => {
      assert.strictEqual(JSONZ.stringify({a: 1, b: 2, 3: 3, false: 4}, ['a', 3, false]), "{a:1,'3':3}");
    });

    it('accepts String and Number objects when an array is provided', () => {
      // eslint-disable-next-line no-new-wrappers
      // noinspection JSPrimitiveTypeWrapperUsage,JSPrimitiveTypeWrapperUsage
      assert.strictEqual(JSONZ.stringify({a: 1, b: 2, 3: 3}, [new String('a'), new Number(3)]), "{a:1,'3':3}");
    });

    it('replaces values when a function is provided', () => {
      assert.strictEqual(
        JSONZ.stringify({a: 1, b: 2}, (key, value) => (key === 'a') ? 2 : value),
        '{a:2,b:2}'
      );
    });

    it('deletes object values when a replacer returns DELETE', () => {
      assert.strictEqual(
        JSONZ.stringify({a: 1, b: 2}, (key, value) => (key === 'b') ? JSONZ.DELETE : value),
        '{a:1}'
      );
    });

    it('can transform object values into undefined values with replacer', () => {
      assert.strictEqual(
        JSONZ.stringify({a: 1, b: 2}, (key, value) => (key === 'b') ? undefined : value),
        '{a:1,b:undefined}'
      );
    });

    it('creates empty array slots when a replacer returns DELETE', () => {
      assert.strictEqual(
        JSONZ.stringify([1, 77, 3], (key, value) => (value === 77) ? JSONZ.DELETE : value),
        '[1,,3]'
      );
    });

    it('can transform array values into undefined values with replacer', () => {
      assert.strictEqual(
        JSONZ.stringify([1, 77, 3], (key, value) => (value === 77) ? undefined : value),
        '[1,undefined,3]'
      );
    });

    it('sets `this` to the parent value', () => {
      assert.strictEqual(
        JSONZ.stringify({a: {b: 1}}, function (k, v) { return (k === 'b' && this.b) ? 2 : v; }),
        '{a:{b:2}}'
      );
    });

    it('is called after toJSON', () => {
      function C() {}
      Object.assign(C.prototype, {toJSON() { return {a: 1, b: 2}; }});
      assert.strictEqual(
        JSONZ.stringify(new C(), (key, value) => (key === 'a') ? 2 : value),
        '{a:2,b:2}'
      );
    });

    it('is called after toJSONZ', () => {
      function C() {}
      Object.assign(C.prototype, {toJSONZ() { return {a: 1, b: 2}; }});
      assert.strictEqual(
        JSONZ.stringify(new C(), (key, value) => (key === 'a') ? 2 : value),
        '{a:2,b:2}'
      );
    });

    it('does not affect space when calls are nested', () => {
      assert.strictEqual(
        JSONZ.stringify({a: 1}, (key, value) => {
          JSONZ.stringify({}, null, 4);
          return value;
        }, 2),
        '{\n  a: 1\n}'
      );
    });
  });

  describe('#stringify(value, options)', () => {
    it('accepts replacer as an option', () => {
      assert.strictEqual(JSONZ.stringify({a: 1, b: 2, 3: 3}, {replacer: ['a', 3]}), "{a:1,'3':3}");
    });

    it('accepts space as an option', () => {
      assert.strictEqual(JSONZ.stringify([1], {space: 2}), '[\n  1\n]');
    });

    it('accepts trailingComma as an option', () => {
      assert.strictEqual(JSONZ.stringify([1], {trailingComma: true, space: 2}), '[\n  1,\n]');
    });
  });

  describe('#stringify(value, {quote})', () => {
    it('uses double quotes if provided', () => {
      assert.strictEqual(JSONZ.stringify({'a"': '1"'}, {quote: '"'}), '{"a\\"":"1\\""}');
    });

    it('uses single quotes if provided', () => {
      assert.strictEqual(JSONZ.stringify({"a'": "1'"}, {quote: "'"}), "{'a\\'':'1\\''}");
    });
  });

  describe('global stringify options', () => {
    it('formats mostly like standard JSON using default options', () => {
      JSONZ.resetOptions();
      assert.strictEqual(JSONZ.stringify({a: 1}), '{"a":1}');
    });

    it('setting null global options has no effect', () => {
      JSONZ.setOptions(null);
      assert.strictEqual(JSONZ.stringify({a: 1}), '{"a":1}');
    });

    it('global options work', () => {
      JSONZ.setOptions({
        quote: JSONZ.Quote.PREFER_SINGLE,
        space: '  ',
        trailingComma: true,
      });
      assert.strictEqual(JSONZ.stringify({a: 1, b: [1, 2]}), "{\n  'a': 1,\n  'b': [\n    1,\n    2,\n  ],\n}");

      JSONZ.setOptions({quote: JSONZ.Quote.PREFER_DOUBLE});
      assert.strictEqual(JSONZ.stringify({a: 1, b: [1, 2]}), '{\n  "a": 1,\n  "b": [\n    1,\n    2,\n  ],\n}');
    });
  });
});
