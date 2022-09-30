const { src, dest, series, watch } = require('gulp');
const gulp = require('gulp');
const size = require('gulp-size');
const concat = require('gulp-concat');
const htmlMin = require('gulp-htmlmin');
const rename = require("gulp-rename");
const sass = require('gulp-sass')(require('sass'));
const autoprefixes = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const svgSprite = require('gulp-svg-sprite');
const imageMin = require('gulp-imagemin');
const babel = require('gulp-babel');
const notify = require('gulp-notify');
const uglify = require('gulp-uglify-es').default;
const sourcemaps = require('gulp-sourcemaps');
const del = require('del');
const newer = require('gulp-newer');
const ts = require('gulp-typescript');
const plumber = require("gulp-plumber");
const htmlImport = require('gulp-html-import')
const browserSync = require('browser-sync').create();


/* Paths */
const srcPath = 'src/';
const distPath = 'dist/';

const paths = {
   styles: {
      src: ['src/assets/styles/**/*.scss', 'src/assets/css/**/*.sass'],
      dest: 'dist/assets/styles/'
   },
   scripts: {
      src: ['src/assets/js/**/*.js', 'src/assets/js/**/*.ts'],
      dest: 'dist/assets/js/'
   },
   images: {
      src: 'src/assets/images/**/*.{jpg,png,svg,gif,ico,webp,webmanifest,xml,json}',
      dest: 'dist/assets/images/'
   },
   html: {
      src: 'src/**/*.html',
      dest: 'dist/'
   },
   fonts: {
      src: 'src/assets/fonts/**/*.{eot,woff,woff2,ttf,svg}',
      dest: 'dist/assets/fonts/'
   }
}


// очистка при перезапуске
const clean = () => {
   return del(['dist/*', '!dist/assets/images'])
}

// библиотеки
const lib = () => {
   return src('src/assets/lib/**')
      .pipe(dest('dist/assets/lib/'))
      .pipe(browserSync.stream())
}

// обьединяет css файлы в один, добавляет префиксы и делает файл в 1 строку
const styles = () => {
   return src(paths.styles.src)
      .pipe(plumber({
         errorHandler: function (err) {
            notify.onError({
               title: "SCSS Error",
               message: "Error: <%= error.message %>"
            })(err);
            this.emit('end');
         }
      }))
      .pipe(sourcemaps.init())
      .pipe(sass().on('error', sass.logError))
      .pipe(autoprefixes({
         cascade: false
      }))
      .pipe(concat('main.css'))
      // минификация
      .pipe(cleanCSS({
         level: 2
      }))
      .pipe(rename({
         basename: 'main',
         suffix: '.min'
      }))
      .pipe(sourcemaps.write('.'))
      .pipe(size())
      .pipe(dest(paths.styles.dest))
      .pipe(browserSync.stream())
}

//  минимизирует Html
const htmlMinify = () => {
   return src(paths.html.src, { base: srcPath })
      .pipe(plumber())
      .pipe(htmlImport('src/components/'))
      .pipe(htmlMin({
         collapseWhitespace: true
      }))
      .pipe(size())
      .pipe(dest(paths.html.dest))
      .pipe(browserSync.stream())
}

// scripts
const scripts = () => {
   return src(paths.scripts.src)
      .pipe(plumber({
         errorHandler: function (err) {
            notify.onError({
               title: "JS Error",
               message: "Error: <%= error.message %>"
            })(err);
            this.emit('end');
         }
      }))
      .pipe(sourcemaps.init())

      // typescript
      // .pipe(ts({
      //    noImplicitAny: true,
      //    outFile: 'main.min.js'
      // }))

      // приводит js к старому стандарту
      .pipe(babel({
         presets: ['@babel/env']
      }))
      .pipe(uglify({
         toplevel: true
      }).on('error', notify.onError()))
      .pipe(concat('main.js'))
      .pipe(rename({
         basename: 'main',
         suffix: '.min'
      }))
      .pipe(sourcemaps.write('.'))
      .pipe(size())
      .pipe(dest(paths.scripts.dest))
      .pipe(browserSync.stream())
}

// svg спрайты
const svgSprites = () => {
   return src('src/assets/images/svg/**/*.svg')
      .pipe(svgSprite({
         mode: {
            stack: {
               sprite: '../sprite.svg'
            }
         }
      }))
      .pipe(dest('dest/assets/images'))
}

// инициализация browserSync
const watchFiles = () => {
   browserSync.init({
      server: {
         baseDir: 'dist/'
      }
   })
}

// минимизация картинок
const images = () => {
   return src(paths.images.src)
      .pipe(newer(paths.images.dest))
      .pipe(imageMin([
         imageMin.gifsicle({ interlaced: true }),
         imageMin.mozjpeg({ quality: 80, progressive: true }),
         imageMin.optipng({ optimizationLevel: 5 }),
         imageMin.svgo({
            plugins: [
               { removeViewBox: true },
               { cleanupIDs: false }
            ]
         })
      ]))
      .pipe(size())
      .pipe(dest(paths.images.dest))
      .pipe(browserSync.stream())
}

// шрифты
const fonts = () => {
   return src(paths.fonts.src)
      .pipe(dest(paths.fonts.dest))
      .pipe(browserSync.stream())
}

watch(paths.html.src, htmlMinify)
watch(paths.styles.src, styles)
watch(paths.scripts.src, scripts)
watch(paths.images.src, images)
watch(paths.fonts.dest, fonts)
watch('src/assets/images/svg/**/*.svg', svgSprites)
watch('src/assets/lib/**', lib)

exports.styles = styles
exports.images = images
exports.scripts = scripts
exports.htmlMinify = htmlMinify
exports.fonts = fonts
exports.clean = clean
exports.default = gulp.series(clean, gulp.parallel(lib, fonts, htmlMinify, scripts, styles, images, svgSprites), watchFiles)