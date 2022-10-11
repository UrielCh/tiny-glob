const assert = require('assert');
const {
  promisify
} = require('util');
const {
  order
} = require('../test/helpers');
const glob = promisify(require('glob'));
const fast = require('fast-glob');
const tiny = require('../async');

let prev;

module.exports = async function (str, opts) {
  console.log([glob, fast, tiny])
  for (const fn of [glob, fast, tiny]) {
    const tmp = await fn(str, opts).then(order);
    prev && assert.deepEqual(tmp, prev);
    prev = tmp;
  }
}
