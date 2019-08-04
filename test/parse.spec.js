const assert = require('assert');
const sinon = require('sinon');
const JSONZ = require('../lib');
const big = require('../lib/bignumber-util');
const util = require('../lib/util');
const bigInt = require('big-integer');
const Decimal = require('decimal.js');

JSONZ.setBigInt(bigInt);
JSONZ.setBigDecimal(Decimal);
JSONZ.setParseOptions({
  reviveTypedContainers: true,
});

function equalBigNumber(a, b) {
  if (a === b) {
    return true;
  }
  else if (!!a !== !!b || !a) {
    return false;
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
}

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

    // noinspection JSConsecutiveCommasInArrayLiteral
    t.strictSame(
      JSONZ.parse('[1,,2]'),
      // eslint-disable-next-line no-sparse-arrays
      [1,, 2],
      'parses sparse array'
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
      JSONZ.parse('[1,23,456,7890,09,-08]'),
      [1, 23, 456, 7890, 9, -8],
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
      JSONZ.parse('[0o7,0o10,0O755,-0o123,0o2_3,010,-010]'),
      [7, 8, 493, -83, 19, 8, -8],
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
      if (!equalBigNumber(a[i], b[i])) {
        return false;
      }
    }

    return true;
  }

  t.test('bigints', t => {
    const testDigits = '-408151623426875309';

    t.ok(big.hasNativeBigInt() !== undefined, 'can determine native BigInt support');

    JSONZ.setBigInt(true);
    t.ok(big.hasNativeBigInt() === big.hasBigInt(), 'can activate native BigInt support');

    JSONZ.setBigInt(null);
    t.ok(big.getBigIntType() === 'numeric', 'can disable BigInt support');
    JSONZ.setBigInt(bigInt);

    t.ok(
      equalBigNumber(JSONZ.parse(testDigits + 'n'), big.toBigInt(testDigits)),
      big.hasBigInt() ? 'parses bigint' : 'parses best approximation of bigint'
    );

    t.ok(
      equalBigNumber(JSONZ.parse('33n'), big.toBigInt('33')),
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

    for (const testValue of testValues) {
      const bdTestValue = big.toBigDecimal(testValue.replace(/_/g, ''));
      const parsedValue = JSONZ.parse(testValue + 'm');

      t.ok(
        equalBigNumber(bdTestValue, parsedValue),
        big.hasBigDecimal() ? 'parses bigdecimal' : 'parses best approximation of bigdecimal'
      );
    }

    JSONZ.setBigDecimal(null);
    t.ok(big.getBigDecimalType() === 'numeric', 'can disable big decimal support');
    JSONZ.setBigDecimal(Decimal);

    t.end();
  });

  t.test('extended types', t => {
    const dateStr = '2019-07-28T08:49:58.202Z';
    const date = new Date(dateStr);

    t.strictSame(
      JSONZ.parse(`_Date('${dateStr}')`).getTime(),
      date.getTime(),
      'parses date as extended type at root'
    );

    t.strictSame(
      JSONZ.parse(`{_$_:'Date',_$_value:'${dateStr}'}`).getTime(),
      date.getTime(),
      'parses date as from type container at root'
    );

    t.ok(
      isNaN(JSONZ.parse(`_Date()`, {}).getTime()),
      'parses date without argument'
    );

    t.strictSame(
      JSONZ.parse(`[1,2,_Date('${dateStr}'),4]`)[2].getTime(),
      date.getTime(),
      'parses date as extended type in array'
    );

    t.strictSame(
      JSONZ.parse(`[1,2,{_$_:'Date',_$_value:'${dateStr}'},4]`)[2].getTime(),
      date.getTime(),
      'parses date from type container in array'
    );

    t.strictSame(
      JSONZ.parse(`{a:1,b:2,c:_Date('${dateStr}'),d:4}`)['c'].getTime(),
      date.getTime(),
      'parses date as extended type in object'
    );

    t.strictSame(
      JSONZ.parse(`{a:1,b:2,c:{_$_:'Date',_$_value:'${dateStr}'},d:4}`)['c'].getTime(),
      date.getTime(),
      'parses date from type container in object'
    );

    t.strictSame(
      JSONZ.parse(`_$y310_Date   // comment
      ( /* another comment */'${dateStr}'  )  `).getTime(),
      date.getTime(),
      'parses extended types with arbitrary prefixes, embedded whitespace, and comments'
    );

    t.strictSame(
      JSONZ.parse("_BigInt('-123')").toString(),
      '-123',
      'parses bigint as extended type'
    );

    t.strictSame(
      JSONZ.parse("_BigDecimal('3.14')").toString(),
      '3.14',
      'parses bigdecimal as extended type'
    );

    t.strictSame(
      Array.from(JSONZ.parse('_Set([1,2,3])')),
      [1, 2, 3],
      'parses Set as extended type'
    );

    t.strictSame(
      Array.from(JSONZ.parse('_Map([[1,2]])')),
      [[1, 2]],
      'parses Map as extended type'
    );

    t.strictSame(
      Array.from(JSONZ.parse('_Uint8Array("AAEC/f7/")')),
      [0, 1, 2, 253, 254, 255],
      'parses Uint8Array as extended type'
    );

    t.strictSame(
      JSONZ.parse('_foo("bar")'),
      {_$_: 'foo', _$_value: 'bar'},
      'falls back on using a type container for unknown extended type'
    );

    t.ok(
      !util.isTypeContainer(5) && !util.isTypeContainer({_$_: 'foo'}) && !util.isTypeContainer({_$_value: 'foo'}) && !util.isTypeContainer({_$_: 'foo', _$_value: 'bar', baz: 0}),
      'is strict about recognizing type containers'
    );

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
      'parses escaped characters'
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
    JSONZ.parse('{a:1,b:2}', (k, v) => (k === 'a') ? JSONZ.DELETE : v),
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

  // noinspection JSConsecutiveCommasInArrayLiteral
  t.strictSame(
    JSONZ.parse('[0,1,2]', (k, v) => (k === '1') ? JSONZ.DELETE : v),
    [0, , 2], // eslint-disable-line no-sparse-arrays
    'deletes array values'
  );

  t.strictSame(
    JSONZ.parse('33', () => JSONZ.DELETE),
    undefined,
    'returns undefined if top-level value is deleted'
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

t.test('hidden array properties', t => {
  const array1 = JSONZ.parse("[1, 2, 3, #foo: 'bar']");
  const array2 = JSONZ.parse("[7, 8, 9, #baz: 'quux', 10]");
  const array3 = JSONZ.parse("[#start: 77]");

  t.strictSame(
    array1['foo'],
    'bar',
    'hidden property correctly parsed'
  );

  t.strictSame(
    array1.length,
    3,
    "hidden property doesn't effect array length"
  );

  t.ok(
    array2.length === 4 && array2['baz'] === 'quux' && array2[3] === 10,
    "hidden property works in middle of array"
  );

  t.ok(
    array3.length === 0 && array3['start'] === 77,
    "hidden property works at beginning of array"
  );

  t.end();
});

t.test('global parse options', t => {
  const dateStr = '2019-07-28T08:49:58.202Z';
  const date = new Date(dateStr);

  JSONZ.setParseOptions({reviveTypedContainers: false});

  t.strictSame(
    JSONZ.parse(`{_$_:'Date',_$_value:'${dateStr}'}`),
    {_$_: 'Date', _$_value: dateStr},
    'revival of type containers is defeated'
  );

  JSONZ.setParseOptions(null);

  t.strictSame(
    JSONZ.parse(`{_$_:'Date',_$_value:'${dateStr}'}`),
    {_$_: 'Date', _$_value: dateStr},
    'setting null options has no effect'
  );

  t.strictSame(
    JSONZ.parse(`{_$_:'Date',_$_value:'${dateStr}'}`, {reviveTypedContainers: true}).getTime(),
    date.getTime(),
    'revival of type containers can be restored by per-call option'
  );

  JSONZ.setParseOptions({reviver: (key, value) => value === 77 ? 66 : value});

  t.strictSame(
    JSONZ.parse(`[1,2,77,4]`),
    [1, 2, 66, 4],
    'global reviver works'
  );

  JSONZ.resetParseOptions();

  t.strictSame(
    JSONZ.parse(`[1,2,77,4]`),
    [1, 2, 77, 4],
    'global reviver can be cleared by reset'
  );

  t.end();
});
