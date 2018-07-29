const gulp = require('gulp');
const useref = require('gulp-useref');
gulp.task('default' , function() {
	buildForWeb("build/stochsim-web/");
	buildForDesktop("build/package.nw/");
});

function buildForDesktop(rootFolder) {
	// License
	gulp.src('LICENSE.txt')
	.pipe(gulp.dest(rootFolder));

	// Launcher
	gulp.src('index.html')
	.pipe(gulp.dest(rootFolder));

	// OpenSystemDynamics
	gulp.src('OpenSystemDynamics/**')
	.pipe(gulp.dest(rootFolder+'OpenSystemDynamics'));
	
	// package.json
	gulp.src('package.json')
	.pipe(gulp.dest(rootFolder));

	// icons 
	gulp.src('icons/**')
	.pipe(gulp.dest(rootFolder+'icons'));

	// MultiSimulationAnalyser
	gulp.src('MultiSimulationAnalyser/**')
	.pipe(gulp.dest(rootFolder+'MultiSimulationAnalyser'));
}

function buildForWeb(rootFolder) {
	// Launcher
	gulp.src('index.html')
	.pipe(gulp.dest(rootFolder));

	// OpenSystemDynamics
	gulp.src('OpenSystemDynamics/opensystemdynamics/index.html')
	.pipe(useref())
	.pipe(gulp.dest(rootFolder+'OpenSystemDynamics/opensystemdynamics'));

	gulp.src('OpenSystemDynamics/opensystemdynamics/graphics/**')
	.pipe(gulp.dest(rootFolder+'OpenSystemDynamics/opensystemdynamics/graphics'));

	gulp.src('OpenSystemDynamics/opensystemdynamics/jquery-ui-1.12.1/images/**')
	.pipe(gulp.dest(rootFolder+'OpenSystemDynamics/opensystemdynamics/images'));

	// MultiSimulationAnalyser
	gulp.src('MultiSimulationAnalyser/index.html')
	.pipe(useref())
	.pipe(gulp.dest(rootFolder+'MultiSimulationAnalyser'));

	gulp.src('MultiSimulationAnalyser/img/**')
	.pipe(gulp.dest(rootFolder+'MultiSimulationAnalyser/img'));

	gulp.src('MultiSimulationAnalyser/images/**')
	.pipe(gulp.dest(rootFolder+'MultiSimulationAnalyser/images'));

	gulp.src('MultiSimulationAnalyser/icons/**')
	.pipe(gulp.dest(rootFolder+'MultiSimulationAnalyser/icons'));

	gulp.src('MultiSimulationAnalyser/im_img/**')
	.pipe(gulp.dest(rootFolder+'MultiSimulationAnalyser/im_img'));
}
