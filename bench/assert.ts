import assert from 'assert';
import { promisify } from 'util';
import { order } from '../test/helpers';
const glob = promisify(require('glob'));
const fast = require('fast-glob');
import u4tiny from '..';
import tiny from 'tiny-glob';

let prev: any;

export default async function (str: string, opts: any) {
  // console.log([glob, fast, tiny])
  for (const fn of [glob, fast, tiny, u4tiny]) {
    if (fn && fn instanceof Function) {
      const tmp = await fn(str, opts).then(order);
      prev && assert.deepEqual(tmp, prev);
      prev = tmp;
    }
  }
}
