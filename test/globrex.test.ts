import * as test from 'tape';
// import test from 'tape';
import globrex from '../src/globrex';
import { match, matchRegex, matchSegments } from './helpers';

test('globrex: standard', t => {
    t.plan(3);
    let res = globrex('*.js');
    t.equal(typeof globrex, 'function', 'consturctor is a typeof function');
    t.true(res instanceof Object, 'returns object');
    t.equal(res.regex.toString(), '/^.*\\.js$/', 'returns regex object');
});

test('globrex: Standard * matching', t => {
    t.plan(12);
    t.true(match('*', 'foo'), 'match everything');
    t.true(match('*', 'foo', '', { flags: 'g' }), 'match everything');
    t.true(match('f*', 'foo'), 'match the end');
    t.true(match('f*', 'foo', '', { flags: 'g' }), 'match the end');
    t.true(match('*o', 'foo'), 'match the start');
    t.true(match('*o', 'foo', '', { flags: 'g' }), 'match the start');
    t.true(match('f*uck', 'firetruck'), 'match the middle');
    t.true(match('f*uck', 'firetruck', '', { flags: 'g' }), 'match the middle');
    t.false(match('uc', 'firetruck'), 'do not match without g');
    t.true(match('uc', 'firetruck', '', { flags: 'g' }), 'match anywhere with RegExp "g"');
    t.true(match('f*uck', 'fuck'), 'match zero characters');
    t.true(match('f*uck', 'fuck', '', { flags: 'g' }), 'match zero characters');
});

test('globrex: advance * matching', t => {
    t.plan(21);
    t.true(match('*.min.js', 'http://example.com/jquery.min.js', '', { globstar: false }), 'complex match');
    t.true(match('*.min.*', 'http://example.com/jquery.min.js', '', { globstar: false }), 'complex match');
    t.true(match('*/js/*.js', 'http://example.com/js/jquery.min.js', '', { globstar: false }), 'complex match');
    t.true(match('*.min.*', 'http://example.com/jquery.min.js', '', { flags: 'g' }), 'complex match global');
    t.true(match('*.min.js', 'http://example.com/jquery.min.js', '', { flags: 'g' }), 'complex match global');
    t.true(match('*/js/*.js', 'http://example.com/js/jquery.min.js', '', { flags: 'g' }), 'complex match global');

    const str = '\\/$^+?.()=!|{},[].*';
    t.true(match(str, str), 'battle test complex string - strict');
    t.true(match(str, str, '', { flags: 'g' }), 'battle test complex string - strict');

    t.false(match('.min.', 'http://example.com/jquery.min.js'), 'matches without/with using RegExp "g"');
    t.true(match('*.min.*', 'http://example.com/jquery.min.js'), 'matches without/with using RegExp "g"');
    t.true(match('.min.', 'http://example.com/jquery.min.js', '', { flags: 'g' }), 'matches without/with using RegExp "g"');
    t.false(match('http:', 'http://example.com/jquery.min.js'), 'matches without/with using RegExp "g"');
    t.true(match('http:*', 'http://example.com/jquery.min.js'), 'matches without/with using RegExp "g"');
    t.true(match('http:', 'http://example.com/jquery.min.js', '', { flags: 'g' }), 'matches without/with using RegExp "g"');
    t.false(match('min.js', 'http://example.com/jquery.min.js'), 'matches without/with using RegExp "g"');
    t.true(match('*.min.js', 'http://example.com/jquery.min.js'), 'matches without/with using RegExp "g"');
    t.true(match('min.js', 'http://example.com/jquery.min.js', '', { flags: 'g' }), 'matches without/with using RegExp "g"');
    t.true(match('min', 'http://example.com/jquery.min.js', '', { flags: 'g' }), 'match anywhere (globally) using RegExp "g"');
    t.true(match('/js/', 'http://example.com/js/jquery.min.js', '', { flags: 'g' }), 'match anywhere (globally) using RegExp "g"');
    t.false(match('/js*jq*.js', 'http://example.com/js/jquery.min.js'));
    t.true(match('/js*jq*.js', 'http://example.com/js/jquery.min.js', '', { flags: 'g' }));
});

test('globrex: ? match one character, no more and no less', t => {
    t.plan(15);
    t.true(match('f?o', 'foo', '', { extended: true }))
    t.false(match('f?o', 'fooo', '', { extended: true }))
    t.false(match('f?oo', 'foo', '', { extended: true }))

    const tester = (globstar: boolean) => {
        t.true(match('f?o', 'foo', '', { extended: true, globstar, flags: 'g' }))
        t.true(match('f?o', 'fooo', '', { extended: true, globstar, flags: 'g' }))
        t.true(match('f?o?', 'fooo', '', { extended: true, globstar, flags: 'g' }))
        t.false(match('?fo', 'fooo', '', { extended: true, globstar, flags: 'g' }))
        t.false(match('f?oo', 'foo', '', { extended: true, globstar, flags: 'g' }))
        t.false(match('foo?', 'foo', '', { extended: true, globstar, flags: 'g' }))
    }

    tester(true);
    tester(false);
});

test('globrex: [] match a character range', t => {
    t.plan(13);
    t.true(match('fo[oz]', 'foo', '', { extended: true }));
    t.true(match('fo[oz]', 'foz', '', { extended: true }));
    t.false(match('fo[oz]', 'fog', '', { extended: true }));
    t.true(match('fo[a-z]', 'fob', '', { extended: true }));
    t.false(match('fo[a-d]', 'fot', '', { extended: true }));
    t.false(match('fo[!tz]', 'fot', '', { extended: true }));
    t.true(match('fo[!tz]', 'fob', '', { extended: true }));

    const tester = (globstar: boolean) => {
        t.true(match('fo[oz]', 'foo', '', { extended: true, globstar, flags: 'g' }));
        t.true(match('fo[oz]', 'foz', '', { extended: true, globstar, flags: 'g' }));
        t.false(match('fo[oz]', 'fog', '', { extended: true, globstar, flags: 'g' }));
    }

    tester(true);
    tester(false);
})

test('globrex: [] extended character ranges', t => {
    t.plan(13);
    t.true(match('[[:alnum:]]/bar.txt', 'a/bar.txt', '', { extended: true }));
    t.true(match('@([[:alnum:]abc]|11)/bar.txt', '11/bar.txt', '', { extended: true }));
    t.true(match('@([[:alnum:]abc]|11)/bar.txt', 'a/bar.txt', '', { extended: true }));
    t.true(match('@([[:alnum:]abc]|11)/bar.txt', 'b/bar.txt', '', { extended: true }));
    t.true(match('@([[:alnum:]abc]|11)/bar.txt', 'c/bar.txt', '', { extended: true }));
    t.false(match('@([[:alnum:]abc]|11)/bar.txt', 'abc/bar.txt', '', { extended: true }));
    t.true(match('@([[:alnum:]abc]|11)/bar.txt', '3/bar.txt', '', { extended: true }));
    t.true(match('[[:digit:]]/bar.txt', '1/bar.txt', '', { extended: true }));
    t.true(match('[[:digit:]b]/bar.txt', 'b/bar.txt', '', { extended: true }));
    t.true(match('[![:digit:]b]/bar.txt', 'a/bar.txt', '', { extended: true }));
    t.false(match('[[:alnum:]]/bar.txt', '!/bar.txt', '', { extended: true }));
    t.false(match('[[:digit:]]/bar.txt', 'a/bar.txt', '', { extended: true }));
    t.false(match('[[:digit:]b]/bar.txt', 'a/bar.txt', '', { extended: true }));
});

test('globrex: {} match a choice of different substrings', t => {
    t.plan(12);
    t.equal(match('foo{bar,baaz}', 'foobaaz', '', { extended: true }), true);
    t.equal(match('foo{bar,baaz}', 'foobar', '', { extended: true }), true);
    t.equal(match('foo{bar,baaz}', 'foobuzz', '', { extended: true }), false);
    t.equal(match('foo{bar,b*z}', 'foobuzz', '', { extended: true }), true);

    const tester = (globstar: boolean) => {
        t.equal(match('foo{bar,baaz}', 'foobaaz', '', { extended: true, globstar, flags: 'g' }), true);
        t.equal(match('foo{bar,baaz}', 'foobar', '', { extended: true, globstar, flags: 'g' }), true);
        t.equal(match('foo{bar,baaz}', 'foobuzz', '', { extended: true, globstar, flags: 'g' }), false);
        t.equal(match('foo{bar,b*z}', 'foobuzz', '', { extended: true, globstar, flags: 'g' }), true);
    }

    tester(true);
    tester(false);
});

test('globrex: complex extended matches', t => {
    t.plan(15)
    t.equal(match('http://?o[oz].b*z.com/{*.js,*.html}', 'http://foo.baaz.com/jquery.min.js', '', { extended: true }), true);
    t.equal(match('http://?o[oz].b*z.com/{*.js,*.html}', 'http://moz.buzz.com/index.html', '', { extended: true }), true);
    t.equal(match('http://?o[oz].b*z.com/{*.js,*.html}', 'http://moz.buzz.com/index.htm', '', { extended: true }), false);
    t.equal(match('http://?o[oz].b*z.com/{*.js,*.html}', 'http://moz.bar.com/index.html', '', { extended: true }), false);
    t.equal(match('http://?o[oz].b*z.com/{*.js,*.html}', 'http://flozz.buzz.com/index.html', '', { extended: true }), false);

    const tester = (globstar: boolean) => {
        t.equal(match('http://?o[oz].b*z.com/{*.js,*.html}', 'http://foo.baaz.com/jquery.min.js', '', { extended: true, globstar, flags: 'g' }), true);
        t.equal(match('http://?o[oz].b*z.com/{*.js,*.html}', 'http://moz.buzz.com/index.html', '', { extended: true, globstar, flags: 'g' }), true);
        t.equal(match('http://?o[oz].b*z.com/{*.js,*.html}', 'http://moz.buzz.com/index.htm', '', { extended: true, globstar, flags: 'g' }), false);
        t.equal(match('http://?o[oz].b*z.com/{*.js,*.html}', 'http://moz.bar.com/index.html', '', { extended: true, globstar, flags: 'g' }), false);
        t.equal(match('http://?o[oz].b*z.com/{*.js,*.html}', 'http://flozz.buzz.com/index.html', '', { extended: true, globstar, flags: 'g' }), false);
    }

    tester(true);
    tester(false);
});

test('globrex: standard globstar', t => {
    t.plan(6);

    const tester = (globstar: boolean) => {
        t.equal(match('http://foo.com/**/{*.js,*.html}', 'http://foo.com/bar/jquery.min.js', '', { extended: true, globstar, flags: 'g' }), true);
        t.equal(match('http://foo.com/**/{*.js,*.html}', 'http://foo.com/bar/baz/jquery.min.js', '', { extended: true, globstar, flags: 'g' }), true);
        t.equal(match('http://foo.com/**', 'http://foo.com/bar/baz/jquery.min.js', '', { extended: true, globstar, flags: 'g' }), true);
    }

    tester(true);
    tester(false);
});

test('globrex: remaining chars should match themself', t => {
    t.plan(4);

    const tester = (globstar: boolean) => {
        const testExtStr = '\\/$^+.()=!|,.*';
        t.equal(match(testExtStr, testExtStr, '', { extended: true }), true);
        t.equal(match(testExtStr, testExtStr, '', { extended: true, globstar, flags: 'g' }), true);
    }

    tester(true);
    tester(false);
});

test('globrex: globstar advance testing', t => {
    t.plan(36);
    t.true(match('/foo/*', '/foo/bar.txt', '', { globstar: true }));
    t.true(match('/foo/**', '/foo/bar.txt', '', { globstar: true }));
    t.true(match('/foo/**', '/foo/bar/baz.txt', '', { globstar: true }));
    t.true(match('/foo/**', '/foo/bar/baz.txt', '', { globstar: true }));
    t.true(match('/foo/*/*.txt', '/foo/bar/baz.txt', '', { globstar: true }));
    t.true(match('/foo/**/*.txt', '/foo/bar/baz.txt', '', { globstar: true }));
    t.true(match('/foo/**/*.txt', '/foo/bar/baz/qux.txt', '', { globstar: true }));
    t.true(match('/foo/**/bar.txt', '/foo/bar.txt', '', { globstar: true }));
    t.true(match('/foo/**/**/bar.txt', '/foo/bar.txt', '', { globstar: true }));
    t.true(match('/foo/**/*/baz.txt', '/foo/bar/baz.txt', '', { globstar: true }));
    t.true(match('/foo/**/*.txt', '/foo/bar.txt', '', { globstar: true }));
    t.true(match('/foo/**/**/*.txt', '/foo/bar.txt', '', { globstar: true }));
    t.true(match('/foo/**/*/*.txt', '/foo/bar/baz.txt', '', { globstar: true }));
    t.true(match('**/*.txt', '/foo/bar/baz/qux.txt', '', { globstar: true }));
    t.true(match('**/foo.txt', 'foo.txt', '', { globstar: true }));
    t.true(match('**/*.txt', 'foo.txt', '', { globstar: true }));
    t.false(match('/foo/*', '/foo/bar/baz.txt', '', { globstar: true }));
    t.false(match('/foo/*.txt', '/foo/bar/baz.txt', '', { globstar: true }));
    t.false(match('/foo/*/*.txt', '/foo/bar/baz/qux.txt', '', { globstar: true }));
    t.false(match('/foo/*/bar.txt', '/foo/bar.txt', '', { globstar: true }));
    t.false(match('/foo/*/*/baz.txt', '/foo/bar/baz.txt', '', { globstar: true }));
    t.false(match('/foo/**.txt', '/foo/bar/baz/qux.txt', '', { globstar: true }));
    t.false(match('/foo/bar**/*.txt', '/foo/bar/baz/qux.txt', '', { globstar: true }));
    t.false(match('/foo/bar**', '/foo/bar/baz.txt', '', { globstar: true }));
    t.false(match('**/.txt', '/foo/bar/baz/qux.txt', '', { globstar: true }));
    t.false(match('*/*.txt', '/foo/bar/baz/qux.txt', '', { globstar: true }));
    t.false(match('*/*.txt', 'foo.txt', '', { globstar: true }));
    t.false(match('http://foo.com/*', 'http://foo.com/bar/baz/jquery.min.js', '', { extended: true, globstar: true }));
    t.false(match('http://foo.com/*', 'http://foo.com/bar/baz/jquery.min.js', '', { globstar: true }));
    t.true(match('http://foo.com/*', 'http://foo.com/bar/baz/jquery.min.js', '', { globstar: false }));
    t.true(match('http://foo.com/**', 'http://foo.com/bar/baz/jquery.min.js', '', { globstar: true }));
    t.true(match("http://foo.com/*/*/jquery.min.js", "http://foo.com/bar/baz/jquery.min.js", '', { globstar: true }));
    t.true(match("http://foo.com/**/jquery.min.js", "http://foo.com/bar/baz/jquery.min.js", '', { globstar: true }));
    t.true(match("http://foo.com/*/*/jquery.min.js", "http://foo.com/bar/baz/jquery.min.js", '', { globstar: false }));
    t.true(match("http://foo.com/*/jquery.min.js", "http://foo.com/bar/baz/jquery.min.js", '', { globstar: false }));
    t.false(match("http://foo.com/*/jquery.min.js", "http://foo.com/bar/baz/jquery.min.js", '', { globstar: true }));
});

test('globrex: extended extglob ?', t => {
    t.plan(17);
    t.true(match('(foo).txt', '(foo).txt', '', { extended: true }));
    t.true(match('?(foo).txt', 'foo.txt', '', { extended: true }));
    t.true(match('?(foo).txt', '.txt', '', { extended: true }));
    t.true(match('?(foo|bar)baz.txt', 'foobaz.txt', '', { extended: true }));
    t.true(match('?(ba[zr]|qux)baz.txt', 'bazbaz.txt', '', { extended: true }));
    t.true(match('?(ba[zr]|qux)baz.txt', 'barbaz.txt', '', { extended: true }));
    t.true(match('?(ba[zr]|qux)baz.txt', 'quxbaz.txt', '', { extended: true }));
    t.true(match('?(ba[!zr]|qux)baz.txt', 'batbaz.txt', '', { extended: true }));
    t.true(match('?(ba*|qux)baz.txt', 'batbaz.txt', '', { extended: true }));
    t.true(match('?(ba*|qux)baz.txt', 'batttbaz.txt', '', { extended: true }));
    t.true(match('?(ba*|qux)baz.txt', 'quxbaz.txt', '', { extended: true }));
    t.true(match('?(ba?(z|r)|qux)baz.txt', 'bazbaz.txt', '', { extended: true }));
    t.true(match('?(ba?(z|?(r))|qux)baz.txt', 'bazbaz.txt', '', { extended: true }));
    t.false(match('?(foo).txt', 'foo.txt', '', { extended: false }));
    t.false(match('?(foo|bar)baz.txt', 'foobarbaz.txt', '', { extended: true }));
    t.false(match('?(ba[zr]|qux)baz.txt', 'bazquxbaz.txt', '', { extended: true }));
    t.false(match('?(ba[!zr]|qux)baz.txt', 'bazbaz.txt', '', { extended: true }));
});

test('globrex: extended extglob *', t => {
    t.plan(16);
    t.true(match('*(foo).txt', 'foo.txt', '', { extended: true }));
    t.true(match('*foo.txt', 'bofoo.txt', '', { extended: true }));
    t.true(match('*(foo).txt', 'foofoo.txt', '', { extended: true }));
    t.true(match('*(foo).txt', '.txt', '', { extended: true }));
    t.true(match('*(fooo).txt', '.txt', '', { extended: true }));
    t.false(match('*(fooo).txt', 'foo.txt', '', { extended: true }));
    t.true(match('*(foo|bar).txt', 'foobar.txt', '', { extended: true }));
    t.true(match('*(foo|bar).txt', 'barbar.txt', '', { extended: true }));
    t.true(match('*(foo|bar).txt', 'barfoobar.txt', '', { extended: true }));
    t.true(match('*(foo|bar).txt', '.txt', '', { extended: true }));
    t.true(match('*(foo|ba[rt]).txt', 'bat.txt', '', { extended: true }));
    t.true(match('*(foo|b*[rt]).txt', 'blat.txt', '', { extended: true }));
    t.false(match('*(foo|b*[rt]).txt', 'tlat.txt', '', { extended: true }));
    t.true(match('*(*).txt', 'whatever.txt', '', { extended: true, globstar: true }));
    t.true(match('*(foo|bar)/**/*.txt', 'foo/hello/world/bar.txt', '', { extended: true, globstar: true }));
    t.true(match('*(foo|bar)/**/*.txt', 'foo/world/bar.txt', '', { extended: true, globstar: true }));
});

test('globrex: extended extglob +', t => {
    t.plan(4);
    t.true(match('+(foo).txt', 'foo.txt', '', { extended: true }));
    t.true(match('+foo.txt', '+foo.txt', '', { extended: true }));
    t.false(match('+(foo).txt', '.txt', '', { extended: true }));
    t.true(match('+(foo|bar).txt', 'foobar.txt', '', { extended: true }));
});

test('globrex: extended extglob @', t => {
    t.plan(6);
    t.true(match('@(foo).txt', 'foo.txt', '', { extended: true }));
    t.true(match('@foo.txt', '@foo.txt', '', { extended: true }));
    t.true(match('@(foo|baz)bar.txt', 'foobar.txt', '', { extended: true }));
    t.false(match('@(foo|baz)bar.txt', 'foobazbar.txt', '', { extended: true }));
    t.false(match('@(foo|baz)bar.txt', 'foofoobar.txt', '', { extended: true }));
    t.false(match('@(foo|baz)bar.txt', 'toofoobar.txt', '', { extended: true }));
});

test('globrex: extended extglob !', t => {
    t.plan(5);
    t.true(match('!(boo).txt', 'foo.txt', '', { extended: true }));
    t.true(match('!(foo|baz)bar.txt', 'buzbar.txt', '', { extended: true }));
    t.true(match('!bar.txt', '!bar.txt', '', { extended: true }));
    t.true(match('!({foo,bar})baz.txt', 'notbaz.txt', '', { extended: true }));
    t.false(match('!({foo,bar})baz.txt', 'foobaz.txt', '', { extended: true }));
});


test('globrex: strict', t => {
    t.plan(3);
    t.true(match('foo//bar.txt', 'foo/bar.txt'));
    t.true(match('foo///bar.txt', 'foo/bar.txt'));
    t.false(match('foo///bar.txt', 'foo/bar.txt', '', { strict: true }));
});


test('globrex: filepath path-regex', t => {
    let opts = { extended: true, filepath: true, globstar: false };

    let res = globrex('', opts);
    t.true(res.hasOwnProperty('path'));
    t.true(res.path!.hasOwnProperty('regex'));
    t.true(res.path!.hasOwnProperty('segments'));
    t.true(Array.isArray(res.path!.segments));

    const pattern = 'foo/bar/baz.js';
    res = matchRegex(t, pattern, '/^foo\\/bar\\/baz\\.js$/', '/^foo\\\\+bar\\\\+baz\\.js$/', opts);
    t.is(res.path!.segments.length, 3);

    res = matchRegex(t, '../foo/bar.js', '/^\\.\\.\\/foo\\/bar\\.js$/', '/^\\.\\.\\\\+foo\\\\+bar\\.js$/', opts);
    t.is(res.path!.segments.length, 3);

    res = matchRegex(t, '*/bar.js', '/^.*\\/bar\\.js$/', '/^.*\\\\+bar\\.js$/', opts);
    t.is(res.path!.segments.length, 2);

    opts.globstar = true;
    res = matchRegex(t, '**/bar.js', '/^((?:[^\\/]*(?:\\/|$))*)bar\\.js$/', '/^((?:[^\\\\]*(?:\\\\|$))*)bar\\.js$/', opts);
    t.is(res.path!.segments.length, 2);

    t.end();
})

test('globrex: filepath path segments', t => {
    let opts = { extended: true };//, res, win, unix;

    let unix = [/^foo$/, /^bar$/, /^([^\/]*)$/, /^baz\.(md|js|txt)$/].map(a => a.toString());
    let win = [/^foo$/, /^bar$/, /^([^\\]*)$/, /^baz\.(md|js|txt)$/].map(a => a.toString());
    matchSegments(t, 'foo/bar/*/baz.{md,js,txt}', unix, win, { ...opts, globstar: true });

    unix = [/^foo$/, /^.*$/, /^baz\.md$/].map(a => a.toString());
    win = [/^foo$/, /^.*$/, /^baz\.md$/].map(a => a.toString());
    matchSegments(t, 'foo/*/baz.md', unix, win, opts);

    unix = [/^foo$/, /^.*$/, /^baz\.md$/].map(a => a.toString());
    win = [/^foo$/, /^.*$/, /^baz\.md$/].map(a => a.toString());
    matchSegments(t, 'foo/**/baz.md', unix, win, opts);

    unix = [/^foo$/, /^((?:[^\/]*(?:\/|$))*)$/, /^baz\.md$/].map(a => a.toString());
    win = [/^foo$/, /^((?:[^\\]*(?:\\|$))*)$/, /^baz\.md$/].map(a => a.toString());
    matchSegments(t, 'foo/**/baz.md', unix, win, { ...opts, globstar: true });

    unix = [/^foo$/, /^.*$/, /^.*\.md$/].map(a => a.toString());
    win = [/^foo$/, /^.*$/, /^.*\.md$/].map(a => a.toString());
    matchSegments(t, 'foo/**/*.md', unix, win, opts);

    unix = [/^foo$/, /^((?:[^\/]*(?:\/|$))*)$/, /^([^\/]*)\.md$/].map(a => a.toString());
    win = [/^foo$/, /^((?:[^\\]*(?:\\|$))*)$/, /^([^\\]*)\.md$/].map(a => a.toString());
    matchSegments(t, 'foo/**/*.md', unix, win, { ...opts, globstar: true });

    unix = [/^foo$/, /^:$/, /^b:az$/].map(a => a.toString());
    win = [/^foo$/, /^:$/, /^b:az$/].map(a => a.toString());
    matchSegments(t, 'foo/:/b:az', unix, win, opts);

    unix = [/^foo$/, /^baz\.md$/].map(a => a.toString());
    win = [/^foo$/, /^baz\.md$/].map(a => a.toString());
    matchSegments(t, 'foo///baz.md', unix, win, { ...opts, strict: true });

    unix = [/^foo$/, /^baz\.md$/].map(a => a.toString());
    win = [/^foo$/, /^baz\.md$/].map(a => a.toString());
    matchSegments(t, 'foo///baz.md', unix, win, { ...opts, strict: false });

    t.end();
});

test('globrex: stress testing', t => {
    t.plan(8);
    t.true(match('**/*/?yfile.{md,js,txt}', 'foo/bar/baz/myfile.md', '', { extended: true }));
    t.true(match('**/*/?yfile.{md,js,txt}', 'foo/baz/myfile.md', '', { extended: true }));
    t.true(match('**/*/?yfile.{md,js,txt}', 'foo/baz/tyfile.js', '', { extended: true }));
    t.true(match('[[:digit:]_.]/file.js', '1/file.js', '', { extended: true }));
    t.true(match('[[:digit:]_.]/file.js', '2/file.js', '', { extended: true }));
    t.true(match('[[:digit:]_.]/file.js', '_/file.js', '', { extended: true }));
    t.true(match('[[:digit:]_.]/file.js', './file.js', '', { extended: true }));
    t.false(match('[[:digit:]_.]/file.js', 'z/file.js', '', { extended: true }));
});