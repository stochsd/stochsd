const gulp = require('gulp');
const useref = require('gulp-useref');
const rename = require('gulp-rename');
const process = require('process');

gulp.task('default' , function(done) {
	// The difference between the web build and the nwjs build is that the web build compresses everything to one single .js file
	// To load faster over the web
	// When we run locally in nwjs we have no intressed in doing so, and instead just run the code as is
	// Which makes it easier to debug

	process.chdir(__dirname +'/..');
	buildForWeb("distribute/output/stochsd-web/");
	buildForDesktop("distribute/output/package.nw/");
	copyLicenses("distribute/output/");

	// https://stackoverflow.com/questions/36897877/gulp-error-the-following-tasks-did-not-complete-did-you-forget-to-signal-async
	done();
});

function copyLicenses(destFolder) {
	// License
	gulp.src('OpenSystemDynamics/src/license.html')
	.pipe(gulp.dest(destFolder));

	// Third party licenses
	gulp.src('OpenSystemDynamics/src/third-party-licenses.html')
	.pipe(gulp.dest(destFolder));
}

function buildForDesktop(destFolder) {

	// License
	gulp.src('LICENSE.txt')
	.pipe(gulp.dest(destFolder));

	// Launcher
	gulp.src('start.html')
	.pipe(gulp.dest(destFolder));
	
	// package.json. Needed for running "nw ." in output folder
	gulp.src('package.json')
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
	
	// icons 
	gulp.src('icons/**')
	.pipe(gulp.dest(destFolder+'/icons'));

	// icons 
	gulp.src('webapp/**')
	.pipe(gulp.dest(destFolder+'/webapp'));

	// Launcher
	gulp.src('start.html')
	.pipe(rename('index.html'))
	.pipe(gulp.dest(destFolder));

	// Webapp
	gulp.src('MultiSimulationAnalyser/multisimulationanalyser-manifest.json')
	.pipe(gulp.dest(destFolder+'MultiSimulationAnalyser/'));

	gulp.src('MultiSimulationAnalyser/multisimulationanalyser-serviceworker.js')
	.pipe(gulp.dest(destFolder+'MultiSimulationAnalyser/'));

	gulp.src('MultiSimulationAnalyser/stochsd-128.png')
	.pipe(gulp.dest(destFolder+'MultiSimulationAnalyser/'));

	gulp.src('MultiSimulationAnalyser/stochsd-256.png')
	.pipe(gulp.dest(destFolder+'MultiSimulationAnalyser/'));

	// OpenSystemDynamics
	gulp.src('OpenSystemDynamics/src/*.html')
	.pipe(useref())
	.pipe(gulp.dest(destFolder+'OpenSystemDynamics/src'));

	gulp.src('OpenSystemDynamics/src/graphics/**')
	.pipe(gulp.dest(destFolder+'OpenSystemDynamics/src/graphics'));

	gulp.src('OpenSystemDynamics/src/jquery/jquery-ui-1.12.1/images/**')
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
