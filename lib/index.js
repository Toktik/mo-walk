'use strict';

const Assert = require('assert');
const { promises: Fs } = require('fs');
const Path = require('path');

const internals = {};

exports.walk = async (mo, path, options = {}) => {

    const {
        extensions = exports.defaultExtensions,
        include = () => true,
        exclude = () => false,
        recursive = true,
        stopAtIndexes = true,
        visit
    } = options;

    Assert.ok(typeof visit === 'function', 'Please specify options.visit as a function.');

    const entryFilename = (dirname, entry) => Path.join(dirname, entry.name);

    const entryMatches = (dirname, entry) => {

        const filename = entryFilename(dirname, entry);
        const extension = Path.extname(entry.name).slice(1);

        return extensions.includes(extension) &&
            include(filename, entry.name) &&
            !exclude(filename, entry.name);
    };

    const walkEntry = async (dirname, entry) => {

        const filename = entryFilename(dirname, entry);
        const value = Path.extname(entry.name) === '.mjs' ?
            await import(filename) :
            mo.require(filename);

        await visit(value, filename, entry.name);
    };

    const walkDirectory = async (dirname) => {

        const directories = [];
        const files = [];
        const indexes = [];
        const entries = await Fs.readdir(dirname, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isDirectory()) {
                directories.push(entry);
            }
            else if (entryMatches(dirname, entry)) {
                files.push(entry);
                if (Path.basename(entry.name, Path.extname(entry.name)) === 'index') {
                    indexes.push(entry);
                }
            }
        }

        if (stopAtIndexes && indexes.length) {
            Assert.ok(indexes.length === 1, `Multiple index entries found in ${dirname}: ${indexes.map((e) => e.name).join(', ')}.`);
            await walkEntry(dirname, indexes[0]);
        }
        else {
            await Promise.all(files.map(
                (entry) => walkEntry(dirname, entry)
            ));
            if (recursive) {
                await Promise.all(directories.map(
                    (entry) => walkDirectory(entryFilename(dirname, entry))
                ));
            }
        }
    };

    await walkDirectory(Path.resolve(Path.dirname(mo.filename), path));
};

exports.defaultExtensions = ['js', 'mjs', 'json'];

exports.tryToResolve = async (path) => {

    if (Path.extname(path) === '.mjs') {
        return await internals.tryToResolveESM(path);
    }

    return internals.tryToResolveCJS(path) ||
        await internals.tryToResolveESM(`${path}.mjs`) ||
        await internals.tryToResolveESM(Path.join(path, 'index.mjs'));
};

internals.tryToResolveCJS = (path) => {

    try {
        const filepath = require.resolve(path);
        return [require(path), filepath];
    }
    catch (err) {
        Assert.ok(err.code === 'MODULE_NOT_FOUND' && err.message.includes(`'${path}'`), err);
    }
};

internals.tryToResolveESM = async (filepath) => {

    Assert.ok(Path.extname(filepath) === '.mjs');

    try {
        return [await import(filepath), filepath];
    }
    catch (err) {
        Assert.ok(err.code === 'ERR_MODULE_NOT_FOUND' && err.message.includes(`'${filepath}'`), err);
    }
};
