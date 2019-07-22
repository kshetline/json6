const assert = require('assert');
const sinon = require('sinon');

require('tap').mochaGlobals();

describe('require(*.jsonz)', () => {
  it('parses a JSON-Z document', () => {
    require('../lib/register');
    assert.deepStrictEqual({a: 1, b: 2}, require('./test.jsonz'));
  });

  it('is backward compatible with v0.5.1, but gives a deprecation warning', () => {
    const mock = sinon.mock(console);
    mock.expects('warn').once().withExactArgs("'json-z/require' is deprecated. Please use 'json-z/register' instead.");
    require('../lib/require');
    assert.deepStrictEqual({a: 1, b: 2}, require('./test.jsonz'));
    mock.verify();
  });

  it('throws on invalid JSON-Z', () => {
    require('../lib/register');
    assert.throws(() => { require('./invalid.jsonz'); }, SyntaxError);
  });
});
