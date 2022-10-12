import globrex, { Options, Results } from '../../src/globrex';
import test from 'tape';
const isWin = process.platform === 'win32';

// unixify path for cross-platform testing
export function unixify(str: string) {
  return isWin ? str.replace(/\\/g, '/') : str;
}

function toIgnore(str: string) {
  return !str.includes('.DS_Store');
}

export function order(arr: string[]) {
  return arr.filter(toIgnore).map(unixify).sort();
}

export function match(glob: string, strUnix: string, strWin?: string, opts = {} as Options): boolean {
  // if (typeof strWin === 'object') {
  //   opts = strWin;
  //   strWin = '';
  // }
  let res = globrex(glob, opts);
  return res.regex.test(isWin && strWin ? strWin : strUnix);
}

export function matchRegex(t: test.Test, pattern: string, ifUnix: string, ifWin: string, opts: Options): Results {
  const res = globrex(pattern, opts);
  const { regex } = (opts.filepath ? res.path : res) as any;
  t.is(regex.toString(), isWin ? ifWin : ifUnix, '~> regex matches expectant');
  return res;
}

export function matchSegments(t: test.Test, pattern: string, ifUnix: string[], ifWin: string[], opts: Options): Results {
  const res = globrex(pattern, { filepath: true, ...opts });
  const str = res.path!.segments.join(' ');
  const exp = (isWin ? ifWin : ifUnix).join(' ');
  t.is(str, exp);
  return res;
}