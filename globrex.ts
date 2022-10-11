const isWin = process.platform === 'win32';
const SEP = isWin ? `\\\\+` : `\\/`;
const SEP_ESC = isWin ? `\\\\` : `/`;
const GLOBSTAR = `((?:[^/]*(?:/|$))*)`;
const WILDCARD = `([^/]*)`;
const GLOBSTAR_SEGMENT = `((?:[^${SEP_ESC}]*(?:${SEP_ESC}|$))*)`;
const WILDCARD_SEGMENT = `([^${SEP_ESC}]*)`;

interface PathTmp {
    segments: RegExp[],
    globstar?: RegExp
    regex: string | RegExp,
};

export interface Path {
    /**
     * Array of RegExp instances separated by /.
     * This can be usable when working with file paths or urls.
     * ```js
     * [ /^foo$/, /^bar$/, /^([^\/]*)$/, '^baz\\.(md|js|txt)$' ]
     * ```
     */
    segments: RegExp[];
    /**
     * String representation of the RegExp
     */
    string: string;
    /**
     * JavaScript RegExp instance build for testing against paths.
     * The regex have different path separators depending on host OS.
     */
    regex: RegExp;
}


interface Results {
    /** This property only exists if the option `filepath` is true. */
    path?: Path;
    /** JavaScript RegExp instance. */
    regex: RegExp;
}

type Opt = {
    split?: boolean;
    last?: boolean;
    only?: string;
}

export interface Options {
    /**
     * Enable all advanced features from extglob.
     * Matching so called "extended" globs pattern like single character matching,
     * matching ranges of characters, group matching, etc.
     * Note: Interprets [a-d] as [abcd].
     * To match a literal -, include it as first or last character.
     * @default false
     */
    extended?: boolean | undefined;
    /**
     * When `globstar` is false globs like '/foo/*' are transformed to the following '^\/foo\/.*$'
     * which will match any string beginning with '/foo/'
     * When the globstar option is true, the same '/foo/*'
     * glob is transformed to '^\/foo\/[^/]*$' which will match any string beginning with '/foo/'
     * that does not have a '/' to the right of it. '/foo/*' will match: '/foo/bar', '/foo/bar.txt' but not '/foo/bar/baz' or '/foo/bar/baz.txt'.
     * Note: When globstar is true, '/foo/**' is equivalent to '/foo/*' when globstar is false
     * @default false
     */
    globstar?: boolean | undefined;
    /**
     * Be forgiving about multiple slashes, like /// and make everything after the first / optional
     * This is how bash glob works.
     * @default false
     */
    strict?: boolean | undefined;
    /**
     * RegExp flags (e.g. `'i'` ) to pass to the RegExp constructor.
     * @default ''
     */
    flags?: string | undefined;
    /**
     * Parse input strings as it was a file path for special path related features.
     * This feature only makes sense if the input is a POSIX path like /foo/bar/hello.js or URLs.
     * When true the returned object will have an additional path object.
     * @default false
     */
    filepath?: boolean | undefined;
}


/**
 * Convert any glob pattern to a JavaScript Regexp object
 * @param {String} glob Glob pattern to convert
 * @param {Object} opts Configuration object
 * @param {Boolean} [opts.extended=false] Support advanced ext globbing
 * @param {Boolean} [opts.globstar=false] Support globstar
 * @param {Boolean} [opts.strict=true] be laissez faire about mutiple slashes
 * @param {Boolean} [opts.filepath=''] Parse as filepath for extra path related features
 * @param {String} [opts.flags=''] RegExp globs
 * @returns {Object} converted object with string, segments and RegExp object
 */
export function globrex(glob: string, { extended = false, globstar = false, strict = false, filepath = false, flags = '' } = {} as Options): Results {
    let regex = '';
    let segment = '';
    let path = { regex: '', segments: [] } as PathTmp;

    // If we are doing extended matching, this boolean is true when we are inside
    // a group (eg {*.html,*.js}), and false otherwise.
    let inGroup = false;
    let inRange = false;

    // extglob stack. Keep track of scope
    const ext = [] as string[];

    // Helper function to build string and segments
    function add(str: string, { split, last, only } = {} as Opt) {
        if (only !== 'path') regex += str;
        if (filepath && only !== 'regex') {
            path.regex += (str === '\\/' ? SEP : str);
            if (split) {
                if (last) segment += str;
                if (segment !== '') {
                    if (!flags.includes('g')) segment = `^${segment}$`; // change it 'includes'
                    path.segments.push(new RegExp(segment, flags));
                }
                segment = '';
            } else {
                segment += str;
            }
        }
    }

    for (let i = 0; i < glob.length; i++) {
        const c = glob[i];
        const n = glob[i + 1];
        switch (c) {
            case '\\':
            case '$':
            case '^':
            case '.':
            case '=':
                add(`\\${c}`);
                break;
            case '/':
                add(`\\${c}`, { split: true });
                if (n === '/' && !strict) regex += '?';
                break;
            case '(':
                if (ext.length) {
                    add(c);
                    break;
                }
                add(`\\${c}`);
                break;
            case ')':
                if (ext.length) {
                    add(c);
                    let type = ext.pop() as string;
                    if (type === '@') {
                        add('{1}');
                    } else if (type === '!') {
                        add('([^\/]*)');
                    } else {
                        add(type);
                    }
                    break;
                }
                add(`\\${c}`);
                break;
            case '|':
                if (ext.length) {
                    add(c);
                    break;
                }
                add(`\\${c}`);
                break;
            case '+':
                if (n === '(' && extended) {
                    ext.push(c);
                    break;
                }
                add(`\\${c}`);
                break;
            case '!':
                if (extended) {
                    if (inRange) {
                        add('^');
                        break
                    }
                    if (n === '(') {
                        ext.push(c);
                        add('(?!');
                        i++;
                        break;
                    }
                    add(`\\${c}`);
                    break;
                }
                add(`\\${c}`);
                break;
            case '?':
                if (extended) {
                    if (n === '(') {
                        ext.push(c);
                    } else {
                        add('.');
                    }
                    break;
                }
                add(`\\${c}`);
                break;
            case '[':
                if (inRange && n === ':') {
                    i++; // skip [
                    let value = '';
                    while (glob[++i] !== ':') value += glob[i];
                    if (value === 'alnum') add('(\\w|\\d)');
                    else if (value === 'space') add('\\s');
                    else if (value === 'digit') add('\\d');
                    i++; // skip last ]
                    break;
                }
                if (extended) {
                    inRange = true;
                    add(c);
                    break;
                }
                add(`\\${c}`);
                break;
            case ']':
                if (extended) {
                    inRange = false;
                    add(c);
                    break;
                }
                add(`\\${c}`);
                break;
            case '{':
                if (extended) {
                    inGroup = true;
                    add('(');
                    break;
                }
                add(`\\${c}`);
                break;

            case '}':
                if (extended) {
                    inGroup = false;
                    add(')');
                    break;
                }
                add(`\\${c}`);
                break;
            case ',':
                if (inGroup) {
                    add('|');
                    break;
                }
                add(`\\${c}`);
                break;
            case '*':
                if (n === '(' && extended) {
                    ext.push(c);
                    break;
                }
                // Move over all consecutive "*"'s.
                // Also store the previous and next characters
                let prevChar = glob[i - 1];
                let starCount = 1;
                while (glob[i + 1] === '*') {
                    starCount++;
                    i++;
                }
                let nextChar = glob[i + 1];
                if (!globstar) {
                    // globstar is disabled, so treat any number of "*" as one
                    add('.*');
                } else {
                    // globstar is enabled, so determine if this is a globstar segment
                    let isGlobstar =
                        starCount > 1 && // multiple "*"'s
                        (prevChar === '/' || prevChar === undefined) && // from the start of the segment
                        (nextChar === '/' || nextChar === undefined); // to the end of the segment
                    if (isGlobstar) {
                        // it's a globstar, so match zero or more path segments
                        add(GLOBSTAR, { only: 'regex' });
                        add(GLOBSTAR_SEGMENT, { only: 'path', last: true, split: true });
                        i++; // move over the "/"
                    } else {
                        // it's not a globstar, so only match one path segment
                        add(WILDCARD, { only: 'regex' });
                        add(WILDCARD_SEGMENT, { only: 'path' });
                    }
                }
                break;
            case '@':
                if (extended && n === '(') {
                    ext.push(c);
                    break;
                }
            default:
                add(c);
        } // end switch
    }


    // When regexp 'g' flag is specified don't
    // constrain the regular expression with ^ & $
    if (!flags.includes('g')) {
        regex = `^${regex}$`;
        segment = `^${segment}$`;
        if (filepath) path.regex = `^${path.regex}$`;
    }

    const result: Results = { regex: new RegExp(regex, flags) };

    // Push the last segment
    if (filepath) {
        path.segments.push(new RegExp(segment, flags));
        path.regex = new RegExp(path.regex, flags);
        path.globstar = new RegExp(!flags.includes('g') ? `^${GLOBSTAR_SEGMENT}$` : GLOBSTAR_SEGMENT, flags);
        result.path = path as Path;
    }

    return result;
}

export default globrex;