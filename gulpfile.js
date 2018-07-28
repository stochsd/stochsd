const gulp = require('gulp');
const useref = require('gulp-useref');
gulp.task('default' , function() {
	gulp.src('MultiSimulationAnalyser/index.html')
	.pipe(useref())
	.pipe(gulp.dest('build'));
	
	gulp.src('MultiSimulationAnalyser/img/**')
	.pipe(gulp.dest('build/img'));
	
	gulp.src('MultiSimulationAnalyser/images/**')
	.pipe(gulp.dest('build/images'));
	
	gulp.src('MultiSimulationAnalyser/icons/**')
	.pipe(gulp.dest('build/icons'));
	
	gulp.src('MultiSimulationAnalyser/im_img/**')
	.pipe(gulp.dest('build/im_img'));
});
