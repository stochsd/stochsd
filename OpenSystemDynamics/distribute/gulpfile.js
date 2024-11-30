const gulp = require('gulp');
const useref = require('gulp-useref');
gulp.task('default', function () {
	gulp.src('../index.html')
		.pipe(useref())
		.pipe(gulp.dest('build'));

	gulp.src('../src/third-party-licenses.html')
		.pipe(gulp.dest('build'));

	gulp.src('../src/graphics/**')
		.pipe(gulp.dest('build/graphics'));
});
