var gulp = require('gulp');
var watch = require('gulp-watch');
var del = require('del');
var rename = require('gulp-rename');
var concat = require('gulp-concat');
var template = require('gulp-template');
var data = require('gulp-data');
var fs = require('fs');
var shell = require('gulp-shell');
var jsdoc = require("gulp-jsdoc3");
var uglify = require('gulp-uglify');

var jsSources = [
  './src/**/*.js'
];

gulp.task('build-js', function (callback) {
  return gulp.src(jsSources)
    .pipe(concat('three.portals.js'))
    .pipe(gulp.dest('./dist'));
});

gulp.task('build-minify', ['build-glsl'], function() {
  return gulp.src(jsSources)
    .pipe(concat('bas.js'))
    .pipe(uglify())
    .pipe(rename('bas.min.js'))
    .pipe(gulp.dest('./dist'));
});

gulp.task('watch-js', function() {
  return watch(jsSources, function() {
    gulp.start('build-js')
  });
});

gulp.task('deploy', ['build-js'], shell.task([
  'surge ./ --domain three-portals.surge.sh'
]));

gulp.task('local', shell.task([
  'live-server'
]));

gulp.task('default', [
  'build-js',
  'watch-js',
  'local'
]);
