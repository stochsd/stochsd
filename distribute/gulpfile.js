const gulp = require('gulp');
const useref = require('gulp-useref');
const process = require('process');

gulp.task('default' , function(done) {
	process.chdir(__dirname +'/..');
	buildForWeb("distribute/build/stochsd-web/");
	buildForDesktop("distribute/build/package.nw/");

	// https://stackoverflow.com/questions/36897877/gulp-error-the-following-tasks-did-not-complete-did-you-forget-to-signal-async
	done();
});

function buildForDesktop(destFolder) {
	process.chdir(__dirname +'/..');
	console.log("2")
	console.log(process.cwd())

	// License
	gulp.src('LICENSE.txt')
	.pipe(gulp.dest(destFolder));

	// Launcher
	gulp.src('index.html')
	.pipe(gulp.dest(destFolder));

	// index.js
	gulp.src('index.js')
	.pipe(gulp.dest(destFolder));

	// OpenSystemDynamics
	gulp.src('OpenSystemDynamics/**')
	.pipe(gulp.dest(destFolder+'/OpenSystemDynamics'));

	// icons 
	gulp.src('icons/**')
	.pipe(gulp.dest(destFolder+'/icons'));

	// MultiSimulationAnalyser
	gulp.src('MultiSimulationAnalyser/**')
	.pipe(gulp.dest(destFolder+'/MultiSimulationAnalyser'));
}

function buildForWeb(destFolder) {
	process.chdir(__dirname +'/..');

	console.log("3")
	console.log(process.cwd())

	// Launcher
	gulp.src('index.html')
	.pipe(gulp.dest(destFolder));

	// OpenSystemDynamics
	gulp.src('OpenSystemDynamics/src/index.html')
	.pipe(useref())
	.pipe(gulp.dest(destFolder+'OpenSystemDynamics/src'));
	
	gulp.src('OpenSystemDynamics/src/third-party-licenses.html')
	.pipe(gulp.dest(destFolder+'OpenSystemDynamics/src'));

	gulp.src('OpenSystemDynamics/src/graphics/**')
	.pipe(gulp.dest(destFolder+'OpenSystemDynamics/src/graphics'));

	gulp.src('OpenSystemDynamics/src/jquery-ui-1.12.1/images/**')
	.pipe(gulp.dest(destFolder+'OpenSystemDynamics/src/images'));

	// MultiSimulationAnalyser
	gulp.src('MultiSimulationAnalyser/index.html')
	.pipe(useref())
	.pipe(gulp.dest(destFolder+'MultiSimulationAnalyser'));

	gulp.src('MultiSimulationAnalyser/img/**')
	.pipe(gulp.dest(destFolder+'MultiSimulationAnalyser/img'));

	gulp.src('MultiSimulationAnalyser/images/**')
	.pipe(gulp.dest(destFolder+'MultiSimulationAnalyser/images'));

	gulp.src('MultiSimulationAnalyser/icons/**')
	.pipe(gulp.dest(destFolder+'MultiSimulationAnalyser/icons'));

	gulp.src('MultiSimulationAnalyser/im_img/**')
	.pipe(gulp.dest(destFolder+'MultiSimulationAnalyser/im_img'));
}
