import Table from 'cli-table2';
import Benchmark, { Suite } from 'benchmark';
import assert from './assert';
import { sync } from 'glob';
const fg = require('fast-glob');
import u4curr from '../async';
import tinyBlob from "tiny-glob";

const cwd = __dirname;
const pattern = 'test/*.js';
const head = ['Name', 'Mean time', 'Ops/sec', 'Diff'];

async function onStart() {
  await assert(pattern, {
    cwd
  });
}

new Suite({ onStart, onComplete })
  .add('glob', () => sync(pattern, { cwd }))
  .add('fast-glob', () => fg(pattern, { cwd }))
  .add('@u4/tiny-glob', () => u4curr(pattern, { cwd }))
  .add('tiny-glob', () => tinyBlob(pattern, { cwd }))
  .on('cycle', (e: Benchmark.Event) => console.log(String(e.target)))
  .run({ async: true });

function onComplete(this: Benchmark.Suite) {
  console.log('Fastest is ' + this.filter('fastest').map('name'));

  let prev: any, diff: any;
  const tbl = new Table({
    head
  });

  this.forEach((el: any) => {
    diff = prev ? (((el.hz - prev) * 100 / prev).toFixed(2) + '% faster') : 'N/A';
    tbl.push([el.name, el.stats.mean, el.hz.toLocaleString(), diff] as any)
    prev = el.hz;
  });
  console.log(tbl.toString());
}
