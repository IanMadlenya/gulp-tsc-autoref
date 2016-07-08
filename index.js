var through         = require('through2');
var path            = require('path');
var gutil           = require('gulp-util');
var header          = require('gulp-header');
var fs				= require('fs');
var PluginError     = gutil.PluginError;

const PLUGIN_NAME = 'gulp-tsc-autoref';

function gulpTscAutoref() {

    var searchPattern = /import[\s+].+=[\s+]?(.+);/g;

    return through.obj(function(file, enc, callback) {
        if (file.isStream()) {
            this.emit('error', new PluginError(PLUGIN_NAME, 'Streams are not supported!'));
            return callback();
        }

        if (file.isBuffer()) {
            var match;
            var references = [];
            var contents = file.contents.toString();
            while ((match = searchPattern.exec(contents)) !== null) {
				var refNoExt = match[1].replace(/\./g, '/');
				['.tsx', '.ts'].forEach(function(ext) {
					var refext = refNoExt + ext;
					try {
						fs.accessSync(path.join(file.base, refext));
						references.unshift(refext);
					} catch (e) {
					}
				});
            }
			
            references.forEach(function(ref) {
				var fileDir = path.dirname(file.path);
				var refDir = path.dirname(path.join(file.base, ref));
				var refFileName = path.basename(ref);					
				var relativePathToRef = path.relative(fileDir, refDir);

                var relativePath = path.join(relativePathToRef, refFileName);				

				var stream = header('/// <reference path="${path}"/>\n', {path: relativePath});

				stream.once('data', function(newFile) {
					file.contents = newFile.contents;
				});

				stream.write(file);
            });

        }

        this.push(file);
        callback();
    });
};

module.exports = gulpTscAutoref;
