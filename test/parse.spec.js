const assert = require('assert');
const sinon = require('sinon');
const JSONZ = require('../lib');
const big = require('../lib/bignumber-util');
const bigInt = require('big-integer');
const Decimal = require('decimal.js');

JSONZ.setBigInt(bigInt);
JSONZ.setBigDecimal(Decimal);

require('tap').mochaGlobals();

const t = require('tap');

t.test('parse(text)', t => {
  t.test('objects', t => {
    t.strictSame(
      JSONZ.parse('{}'),
      {},
      'parses empty objects'
    );

    t.strictSame(
      JSONZ.parse('{"a":1}'),
      {a: 1},
      'parses double-quoted string property names'
    );

    t.strictSame(
      JSONZ.parse("{'a':1}"),
      {a: 1},
      'parses single-quoted string property names'
    );

    t.strictSame(
      JSONZ.parse('{`a`:1}'),
      {a: 1},
      'parses backtick-quoted string property names'
    );

    t.strictSame(
      JSONZ.parse('{a:1}'),
      {a: 1},
      'parses unquoted property names'
    );

    t.strictSame(
      JSONZ.parse('{$_:1,_$:2,a\u200C:3}'),
      {$_: 1, _$: 2, 'a\u200C': 3},
      'parses special character property names'
    );

    // noinspection NonAsciiCharacters
    t.strictSame(
      JSONZ.parse('{ùńîċõďë:9}'),
      {'ùńîċõďë': 9},
      'parses unicode property names'
    );

    t.strictSame(
      JSONZ.parse('{\\u0061\\u0062:1,\\u0024\\u005F:2,\\u005F\\u0024:3}'),
      {ab: 1, $_: 2, _$: 3},
      'parses escaped property names'
    );

    t.strictSame(
      JSONZ.parse('{abc:1,def:2}'),
      {abc: 1, def: 2},
      'parses multiple properties'
    );

    t.strictSame(
      JSONZ.parse('{a:{b:2}}'),
      {a: {b: 2}},
      'parses nested objects'
    );

    t.end();
  });

  t.test('arrays', t => {
    t.strictSame(
      JSONZ.parse('[]'),
      [],
      'parses empty arrays'
    );

    t.strictSame(
      JSONZ.parse('[1]'),
      [1],
      'parses array values'
    );

    t.strictSame(
      JSONZ.parse('[1,2]'),
      [1, 2],
      'parses multiple array values'
    );

    t.strictSame(
      JSONZ.parse('[1,[2,3]]'),
      [1, [2, 3]],
      'parses nested arrays'
    );

    t.end();
  });

  t.test('nulls', t => {
    t.equal(
      JSONZ.parse('null'),
      null,
      'parses nulls'
    );

    t.end();
  });

  t.test('undefined values', t => {
    t.equal(
      JSONZ.parse('undefined'),
      undefined,
      'parses undefined'
    );

    t.end();
  });

  t.test('Booleans', t => {
    t.equal(
      JSONZ.parse('true'),
      true,
      'parses true'
    );

    t.equal(
      JSONZ.parse('false'),
      false,
      'parses false'
    );

    t.end();
  });

  t.test('numbers', t => {
    t.strictSame(
      JSONZ.parse('[0,0.,0e0]'),
      [0, 0, 0],
      'parses leading zeroes'
    );

    t.strictSame(
      JSONZ.parse('[1,23,456,7890]'),
      [1, 23, 456, 7890],
      'parses integers'
    );

    t.strictSame(
      JSONZ.parse('[-1,+2,-.1,-0]'),
      [-1, +2, -0.1, -0],
      'parses signed numbers'
    );

    t.strictSame(
      JSONZ.parse('[.1,.23]'),
      [0.1, 0.23],
      'parses leading decimal points'
    );

    t.strictSame(
      JSONZ.parse('[1.0,1.23]'),
      [1, 1.23],
      'parses fractional numbers'
    );

    t.strictSame(
      JSONZ.parse('[123_456,.1_2,-3e2_2,0_6]'),
      [123456, 0.12, -3e22, 6],
      'parses numbers with underscore separators'
    );

    t.strictSame(
      JSONZ.parse('[1e0,1e1,1e01,1.e0,1.1e0,1e-1,1e+1]'),
      [1, 10, 10, 1, 1.1, 0.1, 10],
      'parses exponents'
    );

    t.strictSame(
      JSONZ.parse('[0x1,0x10,0xff,0xFF,0x1_1]'),
      [1, 16, 255, 255, 17],
      'parses hexadecimal numbers'
    );

    t.strictSame(
      JSONZ.parse('[0b1,0B10,0b1011,-0b110101,0b1_01]'),
      [1, 2, 11, -53, 5],
      'parses binary numbers'
    );

    t.strictSame(
      JSONZ.parse('[0o7,0o10,0O755,-0o123,0o2_3]'),
      [7, 8, 493, -83, 19],
      'parses octal numbers'
    );

    t.strictSame(
      JSONZ.parse('[Infinity,-Infinity]'),
      [Infinity, -Infinity],
      'parses signed and unsigned Infinity'
    );

    t.ok(
      isNaN(JSONZ.parse('NaN')),
      'parses NaN'
    );

    t.ok(
      isNaN(JSONZ.parse('-NaN')),
      'parses signed NaN'
    );

    t.end();
  });

  function compareBigIntArrays(a, b) {
    if (a.length !== b.length) {
      return false;
    }

    for (let i = 0; i < a.length; ++i) {
      if (!big.equalBigInt(a[i], b[i])) {
        return false;
      }
    }

    return true;
  }

  t.test('bigints', t => {
    const testDigits = '-408151623426875309';

    t.ok(
      big.equalBigInt(JSONZ.parse(testDigits + 'n'), big.toBigInt(testDigits)),
      big.hasBigInt() ? 'parses bigint' : 'parses best approximation of bigint'
    );

    t.ok(
      big.equalBigInt(JSONZ.parse('33n'), big.toBigInt('33')),
      'parses bigint'
    );

    t.ok(compareBigIntArrays(
      JSONZ.parse('[0x21n,-0xCAFEn,0b11n,-0b1001n,0O17n,-0o123n]'),
      [big.toBigInt(33), big.toBigInt(-51966), big.toBigInt(3), big.toBigInt(-9), big.toBigInt(15), big.toBigInt(-83)]),
    'parses bigints in hex, binary, and octal form'
    );

    t.ok(compareBigIntArrays(
      JSONZ.parse('[123E3n,-6700e-1n,3.14E3n]'),
      [big.toBigInt(123000), big.toBigInt(-670), big.toBigInt(3140)]),
    'parses bigints in exponential form'
    );

    t.end();
  });

  t.test('bigdecimals', t => {
    const testValues = [
      '3.1415926535_8979323846_2643383279_5028841971_6939937510',
      '-3.14',
      '314',
      '-314',
      '3.14E02',
      '-3.14E02',
      '66.',
      '-66.',
    ];

    for (let testValue of testValues) {
      let bdTestValue = big.toBigDecimal(testValue.replace(/_/g, ''));
      let parsedValue = JSONZ.parse(testValue + 'd');

      t.ok(
        big.equalBigDecimal(bdTestValue, parsedValue),
        big.hasBigDecimal() ? 'parses bigdecimal' : 'parses best approximation of bigdecimal'
      );
    }

    t.end();
  });

  t.test('strings', t => {
    t.equal(
      JSONZ.parse('"abc"'),
      'abc',
      'parses double-quoted strings'
    );

    t.equal(
      JSONZ.parse("'abc'"),
      'abc',
      'parses single-quoted strings'
    );

    t.equal(
      JSONZ.parse('`abc`'),
      'abc',
      'parses backtick-quoted strings'
    );

    t.strictSame(
      JSONZ.parse(`['"',"'",'\`']`),
      ['"', "'", '`'],
      'parses quotes in strings');

    t.equal(
      JSONZ.parse(`'\\b\\f\\n\\r\\t\\v\\0\\x0f\\u01fF\\\n\\\r\n\\\r\\\u2028\\\u2029\\a\\'\\"'`),
      `\b\f\n\r\t\v\0\x0f\u01FF\a'"`, // eslint-disable-line no-useless-escape
      'parses escpaed characters'
    );

    t.test('parses line and paragraph separators with a warning', t => {
      const mock = sinon.mock(console);
      mock
        .expects('warn')
        .twice()
        .calledWithMatch('not valid ECMAScript');

      assert.deepStrictEqual(
        JSONZ.parse("'\u2028\u2029'"),
        '\u2028\u2029'
      );

      mock.verify();
      mock.restore();

      t.end();
    });

    t.end();
  });

  t.test('comments', t => {
    t.strictSame(
      JSONZ.parse('{//comment\n}'),
      {},
      'parses single-line comments'
    );

    t.strictSame(
      JSONZ.parse('{}//comment'),
      {},
      'parses single-line comments at end of input'
    );

    t.strictSame(
      JSONZ.parse('{/*comment\n** */}'),
      {},
      'parses multi-line comments'
    );

    t.end();
  });

  t.test('whitespace', t => {
    t.strictSame(
      JSONZ.parse('{\t\v\f \u00A0\uFEFF\n\r\u2028\u2029\u2003}'),
      {},
      'parses whitespace'
    );

    t.end();
  });

  t.end();
});

t.test('parse(text, reviver)', t => {
  t.strictSame(
    JSONZ.parse('{a:1,b:2}', (k, v) => (k === 'a') ? 'revived' : v),
    {a: 'revived', b: 2},
    'modifies property values'
  );

  t.strictSame(
    JSONZ.parse('{a:{b:2}}', (k, v) => (k === 'b') ? 'revived' : v),
    {a: {b: 'revived'}},
    'modifies nested object property values'
  );

  t.strictSame(
    JSONZ.parse('{a:1,b:2}', (k, v) => (k === 'a') ? undefined : v),
    {b: 2},
    'deletes property values'
  );

  t.strictSame(
    JSONZ.parse('[0,1,2]', (k, v) => (k === '1') ? 'revived' : v),
    [0, 'revived', 2],
    'modifies array values'
  );

  t.strictSame(
    JSONZ.parse('[0,[1,2,3]]', (k, v) => (k === '2') ? 'revived' : v),
    [0, [1, 2, 'revived']],
    'modifies nested array values'
  );

  t.strictSame(
    JSONZ.parse('[0,1,2]', (k, v) => (k === '1') ? undefined : v),
    [0, , 2], // eslint-disable-line no-sparse-arrays
    'deletes array values'
  );

  t.equal(
    JSONZ.parse('1', (k, v) => (k === '') ? 'revived' : v),
    'revived',
    'modifies the root value'
  );

  t.strictSame(
    JSONZ.parse('{a:{b:2}}', function (k, v) { return (k === 'b' && this.b) ? 'revived' : v; }),
    {a: {b: 'revived'}},
    'sets `this` to the parent value'
  );

  t.end();
});
