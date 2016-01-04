var gulp = require('gulp'),
  useref = require('gulp-useref'),
  del = require('del');


gulp.task('clean', function() {
  return del([
    'demo.html',
    'src',
    'stylesheets/demo.css'
  ]);
});


gulp.task('useref', ['clean'], function() {
  return gulp.src('app/demo.html')
    .pipe(useref())
    .pipe(gulp.dest(''));
});


gulp.task('copy', ['clean'], function() {
  return gulp
    .src(['app/src/**/*.js','app/src/**/*.html'])
    .pipe(gulp.dest('src'))
});

gulp.task('build', ['useref', 'copy']);

gulp.task('default', ['build']);
