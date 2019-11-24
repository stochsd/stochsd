const gulp = require('gulp');
const useref = require('gulp-useref');
gulp.task('default' , function() {
	gulp.src('../src/index.html')
	.pipe(useref())
	.pipe(gulp.dest('build'));
	
	gulp.src('../src/graphics/**')
	.pipe(gulp.dest('build/graphics'));
});
