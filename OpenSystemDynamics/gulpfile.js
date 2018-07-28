const gulp = require('gulp');
const useref = require('gulp-useref');
gulp.task('default' , function() {
	gulp.src('opensystemdynamics/index.html')
	.pipe(useref())
	.pipe(gulp.dest('build'));
	
	gulp.src('opensystemdynamics/graphics/**')
	.pipe(gulp.dest('build/graphics'));
});
