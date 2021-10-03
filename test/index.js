'use strict';

// Load modules

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

        require.extensions['.cjs'] = require.extensions['.js'];
        flags.onCleanup = () => {

            delete require.extensions['.cjs'];
        };

        await Mo.walk(module, 'closet/kitchen-sink', {
            recursive: false,
            extensions: [...Mo.defaultExtensions, 'cjs'],
            visit: (value, path, filename) => {

                visits.push([value, filename, relativize(path)]);
            }
        });

        expect(visits.sort(byPath)).to.equal([
            [{ a: 'js' }, 'a.js', 'kitchen-sink/a.js'],
            [{ default: { b: 'mjs' } }, 'b.mjs', 'kitchen-sink/b.mjs'],
            [{ c: 'json' }, 'c.json', 'kitchen-sink/c.json'],
            [{ e: 'cjs' }, 'e.cjs', 'kitchen-sink/e.cjs']
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
            extensions: [...Mo.defaultExtensions, 'cjs'],
            visit: (value, path, filename) => {

                visits.push([value, filename, relativize(path)]);
            }
        });

        expect(visits.sort(byPath)).to.equal([
            [{ a: 'js' }, 'a.js', 'kitchen-sink/a.js'],
            [{ default: { b: 'mjs' } }, 'b.mjs', 'kitchen-sink/b.mjs'],
            [{ c: 'json' }, 'c.json', 'kitchen-sink/c.json'],
            [{ e: 'cjs' }, 'e.cjs', 'kitchen-sink/e.cjs'],
            [{ f: 'js' }, 'f.js', 'kitchen-sink/x/f.js'],
            [{ default: { g: 'mjs' } }, 'g.mjs', 'kitchen-sink/x/g.mjs'],
            [{ h: 'json' }, 'h.json', 'kitchen-sink/x/y/h.json'],
            [{ default: { index: 'mjs' } }, 'index.mjs', 'kitchen-sink/x/z/index.mjs'],
            [{ k: 'cjs' }, 'k.cjs', 'kitchen-sink/x/y/u/k.cjs'],
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
});
