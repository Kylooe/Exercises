var gulp = require('gulp'),
    imagemin = require('gulp-imagemin');
gulp.task('imagemin', function() {
    gulp.src('img/*.*')
        .pipe(imagemin({
            progressive: true
        }))
        .pipe(gulp.dest('dist/img'))
});