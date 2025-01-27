import * as path from 'path';
const CHARS = { '{': '}', '(': ')', '[': ']' } as { [key: string]: string };
const STRICT = /\\(.)|(^!|\*|[\].+)]\?|\[[^\\\]]+\]|\{[^\\}]+\}|\(\?[:!=][^\\)]+\)|\([^|]+\|[^\\)]+\)|(\\).|([@?!+*]\(.*\)))/;
const RELAXED = /\\(.)|(^!|[*?{}()[\]]|\(\?)/;

export type GlobalyzerRet = {
    base: string;
    glob: string;
    isGlob: boolean;
}

export type GlobalyzerOpt = {
    strict?: boolean;
}

/**
 * Detect if a string cointains glob
 * @param str Input string
 * @param {Object} [options] Configuration object
 * @param {Boolean} [options.strict=true] Use relaxed regex if true
 * @returns {Boolean} true if string contains glob
 */
function isglob(str: string, { strict = true } = {} as GlobalyzerOpt): boolean {
    if (str === '') return false;
    let match: RegExpExecArray | null;
    const rgx = strict ? STRICT : RELAXED;

    while ((match = rgx.exec(str))) {
        if (match[2]) return true;
        let idx = match.index + match[0].length;

        // if an open bracket/brace/paren is escaped,
        // set the index to the next closing character
        let open = match[1];
        let close = open ? CHARS[open] : null;
        if (open && close) {
            let n = str.indexOf(close, idx);
            if (n !== -1) idx = n + 1;
        }

        str = str.slice(idx);
    }
    return false;
}


/**
 * Find the static part of a glob-path,
 * split path and return path part
 * @param {String} str Path/glob string
 * @returns {String} static path section of glob
 */
function parent(strIn: string, { strict = false } = {} as GlobalyzerOpt): string {
    let str = path.normalize(strIn);
    str = str.replace(/\/|\\/g, '/');

    // special case for strings ending in enclosure containing path separator
    if (/[\{\[].*[\/]*.*[\}\]]$/.test(str)) str += '/';

    // preserves full path in case of trailing path separator
    str += 'a';

    do { str = path.dirname(str) }
    while (isglob(str, { strict }) || /(^|[^\\])([\{\[]|\([^\)]+$)/.test(str));

    // remove escape chars and return result
    return str.replace(/\\([\*\?\|\[\]\(\)\{\}])/g, '$1');
};


/**
 * Parse a glob path, and split it by static/glob part
 * @param {String} pattern String path
 * @param {Object} [opts] Options
 * @param {Object} [opts.strict=false] Use strict parsing
 * @returns {Object} object with parsed path
 */
export function globalyzer(pattern: string, opts = {} as GlobalyzerOpt): GlobalyzerRet {
    let base = parent(pattern, opts);
    let isGlob = isglob(pattern, opts);
    let glob = '';

    if (base != '.') {
        glob = pattern.substr(base.length);
        if (glob.startsWith('/')) glob = glob.substr(1);
    } else {
        glob = pattern;
    }

    if (!isGlob) {
        base = path.dirname(pattern);
        glob = base !== '.' ? pattern.substr(base.length) : pattern;
    }

    if (glob.startsWith('./')) glob = glob.substr(2);
    if (glob.startsWith('/')) glob = glob.substr(1);

    return { base, glob, isGlob };
}

export default globalyzer;
