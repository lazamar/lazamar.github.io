---
layout: post
title: Setting up Rollup.js in Grunt, Gulp and the JS API
---

Rollup.js is a nice bundler that gets all of your dependencies and packs them
together with our code. It works like a charm, but the documentation on how to
get up and running with it can be very confusing. Let's make crystal clear!


Rollup.js is great to pack ES6 modules so we can distribute it to browsers that
still do not accept the ES6 module syntax. To distribute to those browsers we
will also need to transpile our code form ES6 to ES5. In the examples I am
using babel to do the transpiling.

We could do the transpiling using Babel's standalone plugins and then later pack
everything with Rollup.js, but the Rollup documentation say it is better to use Babel's
rollup plugin instead, so that is what we will do.

In this post I will show three different ways to use Rollup (with Grunt, with
Gulp and with the pure JS API), they are all equivalent and you only need to
use one of them, so choose whichever fits your workflow better.

For the examples we will have a pretty simple project structure:

```
.
├── build/
├── gulpfile.js OR Gruntfile.js OR rollup.js
├── node_modules/
├── package.json
└── src/
    ├── main.js
    └── myModule.js

```

You can see all the files and examples for all the methods here // TODO

We will have our output in the `build/` folder.

## Using gulp

To use Rollup.js with Gulp we will need to run the following:

```
npm install --save-dev gulp
npm install --save-dev babel-preset-es2015-rollup
npm install --save-dev gulp-rollup
npm install --save-dev gulp-sourcemaps
npm install --save-dev rollup-plugin-babel

```

Our `gulpfile.js` will look like this:

``` javascript
var gulp = require('gulp'),
    sourcemaps = require('gulp-sourcemaps'),
    babel = require('rollup-plugin-babel');
    rollup = require('gulp-rollup'),

gulp.task('rollup', function () {
  gulp.src([
    './src/main.js',
  ])
  .pipe(sourcemaps.init())
  .pipe(rollup({
    plugins: [
      babel({
        exclude: 'node_modules/**',
        presets: ['es2015-rollup'],
      }),
    ],
  }))
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest('./build/'));
})

```

That's all we will need. Now we can just run `gulp rollup`.

# Grunt

For Grunt we will need to use run the following:

```
npm install --save-dev grunt
npm install --save-dev grunt-rollup
npm install --save-dev rollup-plugin-babel
npm install --save-dev babel-preset-es2015-rollup

```

Our `Gruntfile.js` will look like this:

``` javascript
const babel = require('rollup-plugin-babel');

module.exports = function Gruntfile(grunt) {
  grunt.initConfig({
    rollup: {
      options: {
        plugins: function () {
          return [
            babel({
              exclude: './node_modules/**',
              presets: ['es2015-rollup'],
            }),
          ];
        },
      },
      main: {
        dest: 'build/main.js',
        src: 'src/main.js', // Only one source file is permitted
      },
    },
  });

  grunt.loadNpmTasks('grunt-rollup');
};
```

That's it. Just run `grunt rollup` and you will see the output in the build folder.

# JavaScript API

Although in my persolnal experience all the methods performed exactly the same,
the Rollup team advise in favour of using the JavaScript API over the other methods.

For the JS Api we will run:

```
npm install --save-dev rollup
npm install --save-dev babel-preset-es2015-rollup
npm install --save-dev rollup-plugin-babel
```

We will have a `rollup.js` file with the following content:

``` javascript
var rollup = require('rollup');
var babel = require('rollup-plugin-babel');
var fs = require('fs');

const config = {
  entry: './src/main.js', // Entry file
  plugins: [
    babel({
      exclude: 'node_modules/**',
      presets: ['es2015-rollup'],
    }),
  ],
};

rollup.rollup(config)
.then(function (bundle) {

  // Generate bundle + sourcemap
  var result = bundle.generate({
    // output format - 'amd', 'cjs', 'es6', 'iife', 'umd'
    format: 'es6',
  });

  fs.writeFileSync('bundle.js', result.code);

  bundle.write({
    format: 'es6',
    dest: 'build/main.js', // Exit file
  });
});

```

And that's it. You can run it with the command `node rollup.js` from the project's
root folder.

You can see more options, including using SourceMaps and stuff in [here](https://github.com/rollup/rollup/wiki/JavaScript-API).
