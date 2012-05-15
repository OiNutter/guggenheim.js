// guggenheim.js build tasks

var fs = require('fs'),
	sys = require('util'),
	uglifyjs = require("uglify-js"),
	path = require('path')

namespace('guggenheim', function(){

	desc('Default build task. Minifies library and creates dist folder.')
	task('build',[],function(){

		if(!path.existsSync('dist'))
			fs.mkdir('dist')

		var orig_code = fs.readFileSync('src/guggenheim.js').toString(),
			ast = uglifyjs.parser.parse(orig_code), // parse code and get the initial AST
			final_code = "",
			output = fs.openSync('dist/guggenheim.min.js','w+')
	

		ast = uglifyjs.uglify.ast_squeeze(ast) // get an AST with compression optimizations

		fs.writeSync(output,uglifyjs.uglify.gen_code(ast))
	})
})