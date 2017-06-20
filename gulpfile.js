var gulp = require("gulp");
var sass = require("gulp-sass");
var browserSync = require("browser-sync").create();
var useref = require("gulp-useref");
var uglify = require("gulp-uglify");
var gulpIf = require("gulp-if");
var cssnano = require("gulp-cssnano");
var imagemin = require("gulp-imagemin");
var cache = require("gulp-cache");
var del = require("del");
var runSequence = require("run-sequence");

// Development task
gulp.task("default", function(callback) {
	runSequence(["sass", "browserSync", "watch"],
		callback
	);
});

// Production task
gulp.task("build", function(callback) {
	runSequence("clean:dist",
		["sass", "useref", "images", "fonts"],
		callback
	);
});

// Clear image caches from local system
gulp.task("cache:clear", function(callback) {
	return cache.clearAll(callback);
});

// Delete the production directory
gulp.task("clean:dist", function() {
	return del.sync("dist");
});

// Copy fonts from development to production
gulp.task("fonts", function() {
	return gulp.src("app/fonts/**/*")
		.pipe(gulp.dest("dist/fonts"));
});

// Optimize images with caching for production
gulp.task("images", function() {
	return gulp.src("app/images/**/*.+(png|jpg|jpeg|gif|svg)")
		.pipe(cache(imagemin({
			interlaced : true
		 })))
		.pipe(gulp.dest("dist/images"));
});

// Concatenate and minify CSS and JavaScript files into a single file for production
gulp.task("useref", function() {
	return gulp.src("app/*.html")
		.pipe(useref())
		.pipe(gulpIf("*.js", uglify()))
		.pipe(gulpIf("*.css", cssnano()))
		.pipe(gulp.dest("dist"));
});

// Spin up a server at the specified directory using Browser Sync
gulp.task("browserSync", function() {
	browserSync.init({
		server : {
			baseDir : "app"
		}
	});
});

// Compile Sass into CSS and inject new CSS into the browser
gulp.task("sass", function() {
	return gulp.src("app/scss/**/*.scss")
		.pipe(sass())
		.pipe(gulp.dest("app/css"))
		.pipe(browserSync.reload({
			stream : true
		}));
});

// Run the specified tasks concurrently before watching files for changes
gulp.task("watch", ["browserSync", "sass"], function() {
	gulp.watch("app/scss/**/*.scss", ["sass"]);
	gulp.watch("app/*.html", browserSync.reload);
	gulp.watch("app/js/**/*.js", browserSync.reload);
});

