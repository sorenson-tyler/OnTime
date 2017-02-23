(function() {
    'use strict';

    var gulp = require('gulp');
    var jshint = require('gulp-jshint');
    var nodemon = require('gulp-nodemon');

    var jsFiles = ['*.js', 'app/**/*.js'];

    gulp.task('style', function() {
        gulp.src(jsFiles)
            .pipe(jshint())
            .pipe(jshint.reporter('jshint-stylish', {
                verbose: true
            }));
    });

    gulp.task('inject', function() {
        var wiredep = require('wiredep').stream;
        var inject = require('gulp-inject');

        var injectSrc = gulp.src(['./app/**/*.js',
            './assets/css/*.css'
        ], {
            read: false
        });

        var injectOptions = {
            ignorePath: ''
        };

        var options = {
            bowerJson: require('./bower.json'),
            directory: './assets/libs',
            ignorePath: ''
        };

        return gulp.src('./app/*.html')
            .pipe(wiredep(options))
            .pipe(inject(injectSrc, injectOptions))
            .pipe(gulp.dest('./app'));
    });

    gulp.task('serve', ['style', 'inject'], function() {
        var options = {
            script: 'app.js',
            delayTime: 1,
            env: {
                'PORT': 5000
            },
            watch: jsFiles
        };

        return nodemon(options)
            .on('restart', function() {
                console.log('Restarting...');
            });
    });
})();
