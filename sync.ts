import * as fs from 'fs';
import globrex from './globrex';
import globalyzer from './globalyzer';
import { join, resolve, relative } from 'path';
import { BlobOptions, BlobOptionsI, BlobResults, isHidden } from './common';

export let CACHE: { [key: string]: boolean } = {};

function walk(output: string[], prefix: string, lexer: BlobResults, opts: BlobOptionsI, dirname = '', level = 0) {
  const rgx = lexer.segments[level];
  const dir = resolve(opts.cwd, prefix, dirname);
  const files = fs.readdirSync(dir);
  const { dot, filesOnly } = opts;

  for (const file of files) {
    const fullpath = join(dir, file);
    const relpath = dirname ? join(dirname, file) : file;
    if (!dot && isHidden.test(relpath)) continue;
    const isMatch = lexer.regex.test(relpath);
    let isDir = CACHE[relpath];
    if (isDir === undefined) {
      try {
        CACHE[relpath] = isDir = fs.lstatSync(fullpath).isDirectory();
      } catch (e) {
        // no access
        isDir = false;
      }
      CACHE[relpath] = isDir;
    }

    if (!isDir) {
      isMatch && output.push(relative(opts.cwd, fullpath));
      continue;
    }

    if (rgx && !rgx.test(file)) continue;
    !filesOnly && isMatch && output.push(join(prefix, relpath));
    if (rgx && rgx.toString() !== lexer.globstar)
      walk(output, prefix, lexer, opts, relpath, level + 1);
    // walk(output, prefix, lexer, opts, relpath, rgx && rgx.toString() !== lexer.globstar && level + 1);
  }
}

/**
 * Find files using bash-like globbing.
 * All paths are normalized compared to node-glob.
 * @param str Glob string
 * @returns array containing matching files
 */
export function glob(str: string, opts = {} as BlobOptions): string[] {
  if (!str) return [];
  let glob = globalyzer(str);
  opts.cwd = opts.cwd || '.';
  const opts2 = opts as BlobOptionsI;
  if (!glob.isGlob) {
    try {
      let resolved = resolve(opts2.cwd, str);
      let dirent = fs.statSync(resolved);
      if (opts2.filesOnly && !dirent.isFile()) return [];
      return opts2.absolute ? [resolved] : [str];
    } catch (err) {
      const e = err as NodeJS.ErrnoException;
      if (e.code != 'ENOENT') throw err;
      return [];
    }
  }
  if (opts2.flush) CACHE = {};
  let matches = [] as string[];
  const { path } = globrex(glob.glob, { filepath: true, globstar: true, extended: true });
  if (!path)
    return [];
  (path as BlobResults).globstar = (path as any).globstar.toString();
  walk(matches, glob.base, path as BlobResults, opts2, '.', 0);
  if (opts2.absolute)
    matches = matches.map(x => resolve(opts2.cwd, x));
  return matches;
};


export default glob;