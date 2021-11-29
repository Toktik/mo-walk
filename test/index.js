'use strict';

// Load modules

const { AssertionError } = require('assert');
const Path = require('path');
const Lab = require('@hapi/lab');
const Code = require('@hapi/code');
const Mo = require('..');

// Test shortcuts

const { describe, it, before } = exports.lab = Lab.script();
const { expect } = Code;

const internals = {};

describe('MoWalk', () => {

    before(() => {

        const origExt = require.extensions['.js'];
        require.extensions['.js'] = (mod, filename) => {

            if (filename.includes('type-is-module')) {
                // This directory contains .js files which are ESM,
                // which is incompatible with lab's instrumentation.
                // See also .labrc.js.
                return require.extensions['.js.stashed'](mod, filename);
            }

            return origExt(mod, filename);
        };
    });

    const relativize = (filename) => Path.relative(Path.join(__dirname, 'closet'), filename);
    const closet = (path) => Path.resolve(__dirname, 'closet', path);
    const byPath = ([,pathA], [,pathB]) => {

        return pathA > pathB ? 1 : -1;
    };

    it('walks shallowly.', async () => {

        const visits = [];

        await Mo.walk(module, 'closet/kitchen-sink', {
            recursive: false,
            visit: (value, path, filename) => {

                visits.push([value, filename, relativize(path)]);
            }
        });

        expect(visits.sort(byPath)).to.equal([
            [{ a: 'js' }, 'a.js', 'kitchen-sink/a.js'],
            [{ default: { b: 'mjs' } }, 'b.mjs', 'kitchen-sink/b.mjs'],
            [{ c: 'json' }, 'c.json', 'kitchen-sink/c.json']
        ]);
    });

    it('walks shallowly with custom extension.', async (flags) => {

        const visits = [];

        require.extensions['.pjs'] = require.extensions['.js'];
        flags.onCleanup = () => delete require.extensions['.pjs'];

        await Mo.walk(module, 'closet/kitchen-sink', {
            recursive: false,
            extensions: [...Mo.defaultExtensions, 'pjs'],
            visit: (value, path, filename) => {

                visits.push([value, filename, relativize(path)]);
            }
        });

        expect(visits.sort(byPath)).to.equal([
            [{ a: 'js' }, 'a.js', 'kitchen-sink/a.js'],
            [{ default: { b: 'mjs' } }, 'b.mjs', 'kitchen-sink/b.mjs'],
            [{ c: 'json' }, 'c.json', 'kitchen-sink/c.json'],
            [{ e: 'pjs' }, 'e.pjs', 'kitchen-sink/e.pjs']
        ]);
    });

    it('walks recursively.', async () => {

        const visits = [];

        await Mo.walk(module, 'closet/kitchen-sink', {
            recursive: true,
            visit: (value, path, filename) => {

                visits.push([value, filename, relativize(path)]);
            }
        });

        expect(visits.sort(byPath)).to.equal([
            [{ a: 'js' }, 'a.js', 'kitchen-sink/a.js'],
            [{ default: { b: 'mjs' } }, 'b.mjs', 'kitchen-sink/b.mjs'],
            [{ c: 'json' }, 'c.json', 'kitchen-sink/c.json'],
            [{ f: 'js' }, 'f.js', 'kitchen-sink/x/f.js'],
            [{ default: { g: 'mjs' } }, 'g.mjs', 'kitchen-sink/x/g.mjs'],
            [{ h: 'json' }, 'h.json', 'kitchen-sink/x/y/h.json'],
            [{ default: { index: 'mjs' } }, 'index.mjs', 'kitchen-sink/x/z/index.mjs'],
            [{ l: 'js' }, 'l.js', 'kitchen-sink/x/y/u/l.js']
        ]);
    });

    it('walks recursively by default.', async () => {

        const visits = [];

        await Mo.walk(module, 'closet/kitchen-sink', {
            visit: (value, path, filename) => {

                visits.push([value, filename, relativize(path)]);
            }
        });

        expect(visits.sort(byPath)).to.equal([
            [{ a: 'js' }, 'a.js', 'kitchen-sink/a.js'],
            [{ default: { b: 'mjs' } }, 'b.mjs', 'kitchen-sink/b.mjs'],
            [{ c: 'json' }, 'c.json', 'kitchen-sink/c.json'],
            [{ f: 'js' }, 'f.js', 'kitchen-sink/x/f.js'],
            [{ default: { g: 'mjs' } }, 'g.mjs', 'kitchen-sink/x/g.mjs'],
            [{ h: 'json' }, 'h.json', 'kitchen-sink/x/y/h.json'],
            [{ default: { index: 'mjs' } }, 'index.mjs', 'kitchen-sink/x/z/index.mjs'],
            [{ l: 'js' }, 'l.js', 'kitchen-sink/x/y/u/l.js']
        ]);
    });

    it('walks recursively with custom extension.', async () => {

        const visits = [];

        await Mo.walk(module, 'closet/kitchen-sink', {
            recursive: true,
            extensions: [...Mo.defaultExtensions, 'pjs'],
            visit: (value, path, filename, type) => {

                visits.push([value, filename, relativize(path), type]);
            }
        });

        expect(visits.sort(byPath)).to.equal([
            [{ a: 'js' }, 'a.js', 'kitchen-sink/a.js', 'cjs'],
            [{ default: { b: 'mjs' } }, 'b.mjs', 'kitchen-sink/b.mjs', 'esm'],
            [{ c: 'json' }, 'c.json', 'kitchen-sink/c.json', 'cjs'],
            [{ e: 'pjs' }, 'e.pjs', 'kitchen-sink/e.pjs', 'cjs'],
            [{ f: 'js' }, 'f.js', 'kitchen-sink/x/f.js', 'cjs'],
            [{ default: { g: 'mjs' } }, 'g.mjs', 'kitchen-sink/x/g.mjs', 'esm'],
            [{ h: 'json' }, 'h.json', 'kitchen-sink/x/y/h.json', 'cjs'],
            [{ default: { index: 'mjs' } }, 'index.mjs', 'kitchen-sink/x/z/index.mjs', 'esm'],
            [{ k: 'pjs' }, 'k.pjs', 'kitchen-sink/x/y/u/k.pjs', 'cjs'],
            [{ l: 'js' }, 'l.js', 'kitchen-sink/x/y/u/l.js', 'cjs']
        ]);
    });

    it('walks without stopping at indexes.', async () => {

        const visits = [];

        await Mo.walk(module, 'closet/kitchen-sink', {
            stopAtIndexes: false,
            visit: (value, path, filename) => {

                visits.push([value, filename, relativize(path)]);
            }
        });

        expect(visits.sort(byPath)).to.equal([
            [{ a: 'js' }, 'a.js', 'kitchen-sink/a.js'],
            [{ default: { b: 'mjs' } }, 'b.mjs', 'kitchen-sink/b.mjs'],
            [{ c: 'json' }, 'c.json', 'kitchen-sink/c.json'],
            [{ f: 'js' }, 'f.js', 'kitchen-sink/x/f.js'],
            [{ default: { g: 'mjs' } }, 'g.mjs', 'kitchen-sink/x/g.mjs'],
            [{ h: 'json' }, 'h.json', 'kitchen-sink/x/y/h.json'],
            [{ i: 'js' }, 'i.js', 'kitchen-sink/x/z/i.js'],
            [{ default: { index: 'mjs' } }, 'index.mjs', 'kitchen-sink/x/z/index.mjs'],
            [{ default: { j: 'mjs' } }, 'j.mjs', 'kitchen-sink/x/z/j.mjs'],
            [{ l: 'js' }, 'l.js', 'kitchen-sink/x/y/u/l.js'],
            [{ m: 'js' }, 'm.js', 'kitchen-sink/x/z/v/m.js']
        ]);
    });

    it('walks with inclusion by path/filename.', async () => {

        const visitsA = [];

        await Mo.walk(module, 'closet/kitchen-sink', {
            include: (path) => path.includes('kitchen-sink/x/'),
            visit: (value, path, filename) => {

                visitsA.push([value, filename, relativize(path)]);
            }
        });

        expect(visitsA.sort(byPath)).to.equal([
            [{ f: 'js' }, 'f.js', 'kitchen-sink/x/f.js'],
            [{ default: { g: 'mjs' } }, 'g.mjs', 'kitchen-sink/x/g.mjs'],
            [{ h: 'json' }, 'h.json', 'kitchen-sink/x/y/h.json'],
            [{ default: { index: 'mjs' } }, 'index.mjs', 'kitchen-sink/x/z/index.mjs'],
            [{ l: 'js' }, 'l.js', 'kitchen-sink/x/y/u/l.js']
        ]);

        const visitsB = [];

        await Mo.walk(module, 'closet/kitchen-sink', {
            include: (_, filename) => filename.endsWith('.mjs'),
            visit: (value, path, filename) => {

                visitsB.push([value, filename, relativize(path)]);
            }
        });

        expect(visitsB.sort(byPath)).to.equal([
            [{ default: { b: 'mjs' } }, 'b.mjs', 'kitchen-sink/b.mjs'],
            [{ default: { g: 'mjs' } }, 'g.mjs', 'kitchen-sink/x/g.mjs'],
            [{ default: { index: 'mjs' } }, 'index.mjs', 'kitchen-sink/x/z/index.mjs']
        ]);
    });

    it('walks with exclusion by path/filename.', async () => {

        const visitsA = [];

        await Mo.walk(module, 'closet/kitchen-sink', {
            exclude: (path) => !path.includes('kitchen-sink/x/'),
            visit: (value, path, filename) => {

                visitsA.push([value, filename, relativize(path)]);
            }
        });

        expect(visitsA.sort(byPath)).to.equal([
            [{ f: 'js' }, 'f.js', 'kitchen-sink/x/f.js'],
            [{ default: { g: 'mjs' } }, 'g.mjs', 'kitchen-sink/x/g.mjs'],
            [{ h: 'json' }, 'h.json', 'kitchen-sink/x/y/h.json'],
            [{ default: { index: 'mjs' } }, 'index.mjs', 'kitchen-sink/x/z/index.mjs'],
            [{ l: 'js' }, 'l.js', 'kitchen-sink/x/y/u/l.js']
        ]);

        const visitsB = [];

        await Mo.walk(module, 'closet/kitchen-sink', {
            exclude: (_, filename) => !filename.endsWith('.mjs'),
            visit: (value, path, filename) => {

                visitsB.push([value, filename, relativize(path)]);
            }
        });

        expect(visitsB.sort(byPath)).to.equal([
            [{ default: { b: 'mjs' } }, 'b.mjs', 'kitchen-sink/b.mjs'],
            [{ default: { g: 'mjs' } }, 'g.mjs', 'kitchen-sink/x/g.mjs'],
            [{ default: { index: 'mjs' } }, 'index.mjs', 'kitchen-sink/x/z/index.mjs']
        ]);
    });

    it('walks with both inclusion and exclusion.', async () => {

        const visits = [];

        await Mo.walk(module, 'closet/kitchen-sink', {
            include: (path) => path.includes('kitchen-sink/x/'),
            exclude: (_, filename) => filename.endsWith('.json'),
            visit: (value, path, filename) => {

                visits.push([value, filename, relativize(path)]);
            }
        });

        expect(visits.sort(byPath)).to.equal([
            [{ f: 'js' }, 'f.js', 'kitchen-sink/x/f.js'],
            [{ default: { g: 'mjs' } }, 'g.mjs', 'kitchen-sink/x/g.mjs'],
            [{ default: { index: 'mjs' } }, 'index.mjs', 'kitchen-sink/x/z/index.mjs'],
            [{ l: 'js' }, 'l.js', 'kitchen-sink/x/y/u/l.js']
        ]);
    });

    it('walks multiple indexes when not stopping at index.', async () => {

        const visits = [];

        await Mo.walk(module, 'closet/multiple-index', {
            stopAtIndexes: false,
            visit: (value, path, filename) => {

                visits.push([value, filename, relativize(path)]);
            }
        });

        expect(visits.sort(byPath)).to.equal([
            [{ a: 'js' }, 'a.js', 'multiple-index/a.js'],
            [{ b: 'json' }, 'b.json', 'multiple-index/x/b.json'],
            [{ index: 'js' }, 'index.js', 'multiple-index/x/index.js'],
            [{ default: { index: 'mjs' } }, 'index.mjs', 'multiple-index/x/index.mjs']
        ]);
    });

    it('walks awaiting each visit.', async () => {

        const visits = [];
        const wait = (ms) => {

            return new Promise((res) => setTimeout(res, ms));
        };

        await Mo.walk(module, 'closet/kitchen-sink', {
            recursive: false,
            visit: async (value, path, filename) => {

                await wait(5);

                visits.push([value, filename, relativize(path)]);
            }
        });

        expect(visits.sort(byPath)).to.equal([
            [{ a: 'js' }, 'a.js', 'kitchen-sink/a.js'],
            [{ default: { b: 'mjs' } }, 'b.mjs', 'kitchen-sink/b.mjs'],
            [{ c: 'json' }, 'c.json', 'kitchen-sink/c.json']
        ]);
    });

    it('walks recursively (type=module).', async () => {

        const visits = [];

        await Mo.walk(module, 'closet/type-is-module', {
            visit: (value, path, filename, type) => {

                visits.push([value, filename, relativize(path), type]);
            }
        });

        expect(visits.sort(byPath)).to.equal([
            [{ default: { a: 'js' } }, 'a.js', 'type-is-module/a.js', 'esm'],
            [{ default: { d: 'js' } }, 'd.js', 'type-is-module/c/d.js', 'esm'],
            [{ default: { f: 'mjs' } }, 'f.mjs', 'type-is-module/f.mjs', 'esm'],
            [{ g: 'json' }, 'g.json', 'type-is-module/g.json', 'cjs'],
            [{ default: { index: 'js' } }, 'index.js', 'type-is-module/c/e/index.js', 'esm'],
            [{ default: { index: 'js' } }, 'index.js', 'type-is-module/b/index.js', 'esm'],
            [{ type: 'module' }, 'package.json', 'type-is-module/package.json', 'cjs']
        ]);
    });

    it('walks recursively for .ts files.', async (flags) => {

        // Emulate ts-node
        require.extensions['.ts'] = require.extensions['.js'];
        flags.onCleanup = () => delete require.extensions['.ts'];

        const visits = [];

        await Mo.walk(module, 'closet/ts', {
            visit: (value, path, filename, type) => {

                visits.push([value, filename, relativize(path), type]);
            }
        });

        expect(visits.sort(byPath)).to.equal([
            [{ default: { a: 'ts' } }, 'a.ts', 'ts/a.ts', 'cjs'],
            [{ b: 'js' }, 'b.js', 'ts/b.js', 'cjs'],
            [{ default: { d: 'ts' } }, 'd.ts', 'ts/c/d.ts', 'cjs'],
            [{ default: { index: 'ts' } }, 'index.ts', 'ts/c/e/index.ts', 'cjs']
        ]);
    });

    it('fails when a visit fails.', async () => {

        await expect(Mo.walk(module, 'closet/kitchen-sink', {
            recursive: false,
            visit: () => {

                throw new Error('D\'oh!');
            }
        })).to.reject(Error, 'D\'oh!');
    });

    it('fails upon encoutering multiple indexes when stopping at index.', async () => {

        await expect(Mo.walk(module, 'closet/multiple-index', {
            stopAtIndexes: true,
            visit: () => null
        })).to.reject(AssertionError, /^Multiple index entries found in .+?\/multiple-index\/x: index\.js, index\.mjs\.$/);
    });

    it('fails when failing to specific visit option correctly.', async () => {

        await expect(Mo.walk(module, 'closet/multiple-index'))
            .to.reject(AssertionError, 'Please specify options.visit as a function.');

        await expect(Mo.walk(module, 'closet/multiple-index', {}))
            .to.reject(AssertionError, 'Please specify options.visit as a function.');

        await expect(Mo.walk(module, 'closet/multiple-index', { visit: true }))
            .to.reject(AssertionError, 'Please specify options.visit as a function.');
    });

    it('fails when encountering bad syntax.', async () => {

        await expect(Mo.walk(module, 'closet/bad-syntax', { visit: () => null }))
            .to.reject(SyntaxError, 'Unexpected token \':\'');
    });

    it('fails when encountering a runtime error in a module.', async () => {

        await expect(Mo.walk(module, 'closet/bad-at-runtime', { visit: () => null }))
            .to.reject(Error, 'Oops!');
    });

    describe('tryToResolve()', () => {

        const fixture = (filename) => Path.join(__dirname, 'closet', 'try-to-resolve', filename);
        const fixtureTypeModule = (filename) => Path.join(__dirname, 'closet', 'type-is-module', filename);

        it('resolves cjs file.', async () => {

            const resolved = await Mo.tryToResolve(fixture('a'));

            expect(resolved).to.be.an.array().and.length(3);
            expect(resolved[0]).to.equal({ a: 'js' });
            expect(relativize(resolved[1])).to.equal('try-to-resolve/a.js');
            expect(resolved[2]).to.equal('cjs');
        });

        it('resolves cjs directory.', async () => {

            const resolved = await Mo.tryToResolve(fixture('c'));

            expect(resolved).to.be.an.array().and.length(3);
            expect(resolved[0]).to.equal({ c: 'js' });
            expect(relativize(resolved[1])).to.equal('try-to-resolve/c/index.js');
            expect(resolved[2]).to.equal('cjs');
        });

        it('resolves mjs file with extension.', async () => {

            const resolved = await Mo.tryToResolve(fixture('b.mjs'));

            expect(resolved).to.be.an.array().and.length(3);
            expect(resolved[0]).to.equal({ default: { b: 'mjs' } });
            expect(relativize(resolved[1])).to.equal('try-to-resolve/b.mjs');
            expect(resolved[2]).to.equal('esm');
        });

        it('resolves mjs file without extension.', async (flags) => {

            const resolved = await Mo.tryToResolve(fixture('b'));

            expect(resolved).to.be.an.array().and.length(3);
            expect(resolved[0]).to.equal({ default: { b: 'mjs' } });
            expect(relativize(resolved[1])).to.equal('try-to-resolve/b.mjs');
            expect(resolved[2]).to.equal('esm');
        });

        it('resolves mjs directory.', async () => {

            const resolved = await Mo.tryToResolve(fixture('d'));

            expect(resolved).to.be.an.array().and.length(3);
            expect(resolved[0]).to.equal({ default: { d: 'mjs' } });
            expect(relativize(resolved[1])).to.equal('try-to-resolve/d/index.mjs');
            expect(resolved[2]).to.equal('esm');
        });

        it('resolves esm file with js extension (type=module).', async (flags) => {

            const resolved = await Mo.tryToResolve(fixtureTypeModule('a.js'));

            expect(resolved).to.be.an.array().and.length(3);
            expect(resolved[0]).to.equal({ default: { a: 'js' } });
            expect(relativize(resolved[1])).to.equal('type-is-module/a.js');
            expect(resolved[2]).to.equal('esm');
        });

        it('resolves esm file with mjs extension (type=module).', async () => {

            const resolved = await Mo.tryToResolve(fixtureTypeModule('f.mjs'));

            expect(resolved).to.be.an.array().and.length(3);
            expect(resolved[0]).to.equal({ default: { f: 'mjs' } });
            expect(relativize(resolved[1])).to.equal('type-is-module/f.mjs');
            expect(resolved[2]).to.equal('esm');
        });

        it('resolves esm .js file without extension (type=module).', async (flags) => {

            const resolved = await Mo.tryToResolve(fixtureTypeModule('a'));

            expect(resolved).to.be.an.array().and.length(3);
            expect(resolved[0]).to.equal({ default: { a: 'js' } });
            expect(relativize(resolved[1])).to.equal('type-is-module/a.js');
            expect(resolved[2]).to.equal('esm');
        });

        it('resolves esm .mjs file without extension (type=module).', async () => {

            const resolved = await Mo.tryToResolve(fixtureTypeModule('f'));

            expect(resolved).to.be.an.array().and.length(3);
            expect(resolved[0]).to.equal({ default: { f: 'mjs' } });
            expect(relativize(resolved[1])).to.equal('type-is-module/f.mjs');
            expect(resolved[2]).to.equal('esm');
        });

        it('resolves esm .js directory without extension (type=module).', async () => {

            const resolved = await Mo.tryToResolve(fixtureTypeModule('b'));

            expect(resolved).to.be.an.array().and.length(3);
            expect(resolved[0]).to.equal({ default: { index: 'js' } });
            expect(relativize(resolved[1])).to.equal('type-is-module/b/index.js');
            expect(resolved[2]).to.equal('esm');
        });

        it('resolves json file without extension (type=module).', async () => {

            const resolved = await Mo.tryToResolve(fixtureTypeModule('g'));

            expect(resolved).to.be.an.array().and.length(3);
            expect(resolved[0]).to.equal({ g: 'json' });
            expect(relativize(resolved[1])).to.equal('type-is-module/g.json');
            expect(resolved[2]).to.equal('cjs');
        });

        it('resolves nothing gracefully.', async () => {

            const resolved = await Mo.tryToResolve(fixture('nothing'));

            expect(resolved).to.be.undefined();
        });

        it('resolves nothing gracefully (type=module).', async () => {

            const resolved = await Mo.tryToResolve(fixtureTypeModule('nothing'));

            expect(resolved).to.be.undefined();
        });

        it('throws cjs errors.', async () => {

            await expect(Mo.tryToResolve(fixture('a-bad')))
                .to.reject(SyntaxError, 'Unexpected token \':\'');
        });

        it('throws mjs errors.', async () => {

            await expect(Mo.tryToResolve(fixture('b-bad')))
                .to.reject(SyntaxError, 'Unexpected token \':\'');
        });

        it('throws on bad cjs require.', async () => {

            await expect(Mo.tryToResolve(Path.join(__dirname, 'closet/bad-at-runtime/x/y/c.js')))
                .to.reject(/Cannot find module 'bad-require-oops'/);
        });
    });

    describe('getDefaultToESM()', () => {

        it('finds package.json shallowly.', async () => {

            expect(await Mo.getDefaultToESM(closet('type-is-module'))).to.be.true();
        });

        it('finds package.json deeply.', async () => {

            expect(await Mo.getDefaultToESM(closet('kitchen-sink'))).to.be.false();
            expect(await Mo.getDefaultToESM(closet('type-is-module/c/e'))).to.be.true();
        });

        it('defaults to false when encountering a bad package.json.', async () => {

            expect(await Mo.getDefaultToESM(closet('bad-package-json'))).to.be.false();
        });
    });

    describe('getDefaultExport()', () => {

        it('handles falsey values.', () => {

            expect(Mo.getDefaultExport(0, 'x.ts', 'cjs')).to.equal(0);
            expect(Mo.getDefaultExport('', 'x.ts', 'cjs')).to.equal('');
            expect(Mo.getDefaultExport(null, 'x.ts', 'cjs')).to.equal(null);

            expect(Mo.getDefaultExport(0, 'x.mjs', 'esm')).to.equal(0);
            expect(Mo.getDefaultExport('', 'x.mjs', 'esm')).to.equal('');
            expect(Mo.getDefaultExport(null, 'x.mjs', 'esm')).to.equal(null);

            expect(Mo.getDefaultExport(0, 'x.js', 'cjs')).to.equal(0);
            expect(Mo.getDefaultExport('', 'x.js', 'cjs')).to.equal('');
            expect(Mo.getDefaultExport(null, 'x.js', 'cjs')).to.equal(null);
        });

        it('handles non-object values.', () => {

            expect(Mo.getDefaultExport('xyz', 'x.ts', 'cjs')).to.equal('xyz');
            expect(Mo.getDefaultExport('xyz', 'x.mjs', 'esm')).to.equal('xyz');
            expect(Mo.getDefaultExport('xyz', 'x.js', 'cjs')).to.equal('xyz');
        });

        it('handles missing default.', () => {

            expect(Mo.getDefaultExport({ a: 'b' }, 'x.ts', 'cjs')).to.equal({ a: 'b' });
            expect(Mo.getDefaultExport({ a: 'b' }, 'x.mjs', 'esm')).to.equal({ a: 'b' });
            expect(Mo.getDefaultExport({ a: 'b' }, 'x.js', 'cjs')).to.equal({ a: 'b' });
        });

        it('gets default from ts and esm files.', async (flags) => {

            // Emulate ts-node
            require.extensions['.ts'] = require.extensions['.js'];
            flags.onCleanup = () => delete require.extensions['.ts'];

            const ts = await Mo.tryToResolve(closet('ts/a.ts'));
            const esm = await Mo.tryToResolve(closet('try-to-resolve/b.mjs'));

            expect(Mo.getDefaultExport(...ts)).to.equal({ a: 'ts' });
            expect(Mo.getDefaultExport(...esm)).to.equal({ b: 'mjs' });
        });
    });
});
