const gulp = require('gulp');
const useref = require('gulp-useref');
gulp.task('default' , function() {
	// Launcher
	gulp.src('index.html')
	.pipe(gulp.dest('build/'));
	
	// OpenSystemDynamics
	gulp.src('OpenSystemDynamics/opensystemdynamics/index.html')
	.pipe(useref())
	.pipe(gulp.dest('build/OpenSystemDynamics/opensystemdynamics'));
	
	gulp.src('OpenSystemDynamics/opensystemdynamics/graphics/**')
	.pipe(gulp.dest('build/OpenSystemDynamics/opensystemdynamics/graphics'));
	
	// MultiSimulationAnalyser
	gulp.src('MultiSimulationAnalyser/index.html')
	.pipe(useref())
	.pipe(gulp.dest('build/MultiSimulationAnalyser'));
	
	gulp.src('MultiSimulationAnalyser/img/**')
	.pipe(gulp.dest('build/MultiSimulationAnalyser/img'));
	
	gulp.src('MultiSimulationAnalyser/images/**')
	.pipe(gulp.dest('build/MultiSimulationAnalyser/images'));
	
	gulp.src('MultiSimulationAnalyser/icons/**')
	.pipe(gulp.dest('build/MultiSimulationAnalyser/icons'));
	
	gulp.src('MultiSimulationAnalyser/im_img/**')
	.pipe(gulp.dest('build/MultiSimulationAnalyser/im_img'));
});
