'use strict';

// Load modules

const { AssertionError } = require('assert');
const Path = require('path');
const Lab = require('@hapi/lab');
const Code = require('@hapi/code');
const Mo = require('..');

// Test shortcuts

const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;

const internals = {};

describe('MoWalk', () => {

    const relativize = (filename) => Path.relative(Path.join(__dirname, 'closet'), filename);
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
        flags.onCleanup = () => {

            delete require.extensions['.pjs'];
        };

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
            visit: (value, path, filename) => {

                visits.push([value, filename, relativize(path)]);
            }
        });

        expect(visits.sort(byPath)).to.equal([
            [{ a: 'js' }, 'a.js', 'kitchen-sink/a.js'],
            [{ default: { b: 'mjs' } }, 'b.mjs', 'kitchen-sink/b.mjs'],
            [{ c: 'json' }, 'c.json', 'kitchen-sink/c.json'],
            [{ e: 'pjs' }, 'e.pjs', 'kitchen-sink/e.pjs'],
            [{ f: 'js' }, 'f.js', 'kitchen-sink/x/f.js'],
            [{ default: { g: 'mjs' } }, 'g.mjs', 'kitchen-sink/x/g.mjs'],
            [{ h: 'json' }, 'h.json', 'kitchen-sink/x/y/h.json'],
            [{ default: { index: 'mjs' } }, 'index.mjs', 'kitchen-sink/x/z/index.mjs'],
            [{ k: 'pjs' }, 'k.pjs', 'kitchen-sink/x/y/u/k.pjs'],
            [{ l: 'js' }, 'l.js', 'kitchen-sink/x/y/u/l.js']
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

        it('resolves cjs file.', async () => {

            const resolved = await Mo.tryToResolve(fixture('a'));

            expect(resolved).to.be.an.array().and.length(2);
            expect(resolved[0]).to.equal({ a: 'js' });
            expect(relativize(resolved[1])).to.equal('try-to-resolve/a.js');
        });

        it('resolves cjs directory.', async () => {

            const resolved = await Mo.tryToResolve(fixture('c'));

            expect(resolved).to.be.an.array().and.length(2);
            expect(resolved[0]).to.equal({ c: 'js' });
            expect(relativize(resolved[1])).to.equal('try-to-resolve/c/index.js');
        });

        it('resolves mjs file with extension.', async () => {

            const resolved = await Mo.tryToResolve(fixture('b.mjs'));

            expect(resolved).to.be.an.array().and.length(2);
            expect(resolved[0]).to.equal({ default: { b: 'mjs' } });
            expect(relativize(resolved[1])).to.equal('try-to-resolve/b.mjs');
        });

        it('resolves mjs file without extension.', async () => {

            const resolved = await Mo.tryToResolve(fixture('b'));

            expect(resolved).to.be.an.array().and.length(2);
            expect(resolved[0]).to.equal({ default: { b: 'mjs' } });
            expect(relativize(resolved[1])).to.equal('try-to-resolve/b.mjs');
        });

        it('resolves mjs directory.', async () => {

            const resolved = await Mo.tryToResolve(fixture('d'));

            expect(resolved).to.be.an.array().and.length(2);
            expect(resolved[0]).to.equal({ default: { d: 'mjs' } });
            expect(relativize(resolved[1])).to.equal('try-to-resolve/d/index.mjs');
        });

        it('resolves nothing gracefully.', async () => {

            const resolved = await Mo.tryToResolve(fixture('nothing'));

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
    });
});
