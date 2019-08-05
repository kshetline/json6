const assert = require('assert');
const JSONZ = require('../lib/index');

JSONZ.setOptions(JSONZ.OptionSet.MAX_COMPATIBILITY);
JSONZ.setBigInt(false);

require('tap').mochaGlobals();

describe('require(*.jsonz)', () => {
  it('parses a JSON-Z document', () => {
    require('../lib/register');
    assert.deepStrictEqual({$: 100, a: 1, b: 2}, require('./test.jsonz'));
  });

  it('throws on invalid JSON-Z', () => {
    require('../lib/register');
    assert.throws(() => { require('./invalid.jsonz'); }, SyntaxError);
  });
});
