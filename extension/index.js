var fs         = require('fs');
var exec       = require('child_process').exec;
var path       = require('path');
var sass       = require('node-sass');
var postcss    = require('postcss');
var static_dir = path.normalize(process.cwd() + '/public');
var view_dir   = static_dir;
var route_dir  = path.normalize(process.cwd() + '/routes');
var extension  = {
	static_dir     : static_dir,
	route_dir      : route_dir,
	view_dir       : view_dir,
	map_combo_file : {
		'/sfger/js/case/seaShell/_test_.js' : 'data.js,data.js'
	},
	get_combo_file_list: function(file){
		var files = extension.map_combo_file[file].split(',');
		return files.map(function(one){
			return path.normalize(extension.static_dir + path.dirname(file) + '/' + one);
		});
	},

	readJSONFile: function(p){
		var json = {};
		try{
			p = path.normalize(p);
			// var ret = fs.readFileSync(p, {encoding:'utf8', flag: 'r'});
			// json = JSON.parse(ret);
			delete require.cache[require.resolve(p)];
			json = require(p);
		}catch(e){
			console.log(e);
		}
		return json;
	},

	get_read_stream_iterator: function*(list){
		for(var i=0,il=list.length; i<il; i++){
			yield fs.createReadStream(list[i], {autoClose:false});
		}
	},
	pipe_data: function(iterator, writer, next){
		var item = iterator.next();
		if(!item.done){
			item = item.value;
			try{
				item.pipe(writer, {end:false});
				item.on('end', ()=>extension.pipe_data(iterator, writer, next));
			}catch(e){
				console.log(e);
				return next();
			}
		}else{
			writer.end('');
		}
	},
	pipe_stream_list_to_writer: function(list, writer, next){
		var iterator = extension.get_read_stream_iterator(list);
		extension.pipe_data(iterator, writer, next);
		return true;
	},

	/*
	 * 简单的http2.0 combo处理，未做304等状态处理，只供开发使用
	 * */
	staticHttpCombo: function(req, res, next){
		if(req.path in extension.map_combo_file){
			extension.pipe_stream_list_to_writer(extension.get_combo_file_list(req.path), res, next());
			return false;
		}
		if(/\?\?/.test(req.originalUrl)){
			var file_list = req.originalUrl.slice(req.originalUrl.indexOf('??')+2).split('?')[0].split(',');
			var type      = file_list[file_list.length-1].split('.').reverse()[0];
			var types     = {
				"js": "application/x-javascript",
				"css": "text/css"
			};
			if(type==='js' || type==='css'){
				// 跳转，如：http://localhost/public/js??jquery-min.js,jquery-window.js?_a=1&v=201502110322
				//        => http://localhost/public/js/??jquery-min.js,jquery-window.js?_a=1&v=201502110322
				if(req.path[req.path.length-1]!=='/'){
					res.redirect(req.originalUrl.replace(/\?\?/, '/??'));
					// res.writeHead(302);
					return res.end('');
				}
			}else{ //暂时支付css和js，其它暂时没必要处理
				return next();
			}

			var list = [];
			file_list.forEach(function(one){
				var file = req.path + one;
				if(extension.map_combo_file[file]){
					list = list.concat(extension.get_combo_file_list(file));
				}else{
					list.push(path.normalize(extension.static_dir + file));
				}
			});
			res.writeHead(200, {"Content-Type":types[type]});
			if('js'===type){
				extension.pipe_stream_list_to_writer(list, res, next);
			}else{
				extension.compile_list_to_writer(list, res, next);
			}
		}else{
			next();
		}
		return true;
	},

	autoAddRoutes: function(app, dirPath, routePath, defer){
		var routeFiles = fs.readdirSync(dirPath);
		Promise.all(routeFiles.map(function(file){
			return new Promise(function(resolve, reject){
				fs.stat(dirPath+'/'+file, function(err, stats){
					if( stats.isDirectory() ){
						extension.autoAddRoutes(app, dirPath+'/'+file, routePath+file+'/', {resolve:resolve, reject:reject});
					}else if( stats.isFile() ){
						var list = file.split('.');
						if(list.length==2 && list[1]==='js'){
							var path   = routePath + list[0];
							var module = '/routes' + path;
							console.log("Auto add route!\n\tPath: ", path, '\n\tModule: ', module);
							app.use('/', require('..'+module));
						}
						resolve();
					}else{
						resolve();
					}
				});
			});
		})).then(function(){
			defer.resolve();
		});
	},
	dist: function(err, ret){
		var req = this.req;
		if(err){
			console.log(err);
			return false;
		}
		// console.log(extension);
		ret = extension.minifyHTML(ret);
		if(req.query.dist!=='0'){
			extension.writeStaticCache(this.distPath || req.route.path, ret);
		}
		this.res.send(ret);
	},
	minifyHTML: function(str){
		str = (str||'').replace(/(\/?>)\s+|\s+(?=<)/g, '$1')
		.replace(/\s*([\r\n]+)\s*/g, '$1');
		return str;
	},
	writeStaticCache: function(url, ret){
		// console.log(url);
		if(typeof url == 'object' && url.length) url = url[0];
		var url_path = url.replace(/^\/|\/$/g, '');
		// url_path = extension.static_dir + '/../html/' + (url_path || 'index') + '.html';
		url_path = extension.static_dir + '/' + (url_path || 'index') + '.html';
		url_path = path.normalize(url_path);
		extension.mkdirRecursive(path.dirname(url_path), 777, function(){
			fs.writeFile(url_path, ret, function(err){
				if(err) throw err;
				console.log('Dist ' + url_path + ' succeed!');
			});
		});
	},
	mkdirRecursive: function(dirpath, mode, callback){
		var that = this;
		fs.exists(dirpath, function(exists){
			if(exists){
				callback(dirpath);
			}else{
				that.mkdirRecursive(path.dirname(dirpath), mode, function(){
					fs.mkdir(dirpath, mode, callback);
				});
			}
		});
	},
	sass: {
		ruby: function(in_file, out_file, lib, next){
			var sh = [
				'scss',
				'--sourcemap=none',
				'-t compressed',
				// '-I ' + lib,
				in_file,
				out_file
			];
			// console.log(sh.join(' '));
			exec(sh.join(' '), function(error, stdout, stderr){
				if(error){
					console.log(error);
					console.log(stdout);
					console.log(stderr);
				}
				return next();
			});
		},
		node: function(in_file, out_file, defer){
			sass.render({
				// data      : 'body{background:blue; a{color:black;}}',
				includePaths : [path.normalize(process.cwd()+'/public/sfger/scss')],
				linefeed     : 'lf',
				file         : in_file,
				indentWidth  : 1,
				indentType   : 'tab',
				outputStyle  : 'compact'
			}, function(error, result){
				if(error){
					console.log(error);
					console.log(error.status);
					console.log(error.column);
					console.log(error.message);
					console.log(error.line);
				}else{
					postcss([
						// require('postcss-sprites')({
						// 	stylesheetPath:path.dirname(out_file),
						// 	spritePath:out_file+'.sprite.png'
						// }),
						require('postcss-image-inliner')({
							assetPaths:[path.dirname(out_file)],
							maxFileSize:20480
						}),
						require('precss')({}),
						require('postcss-urlrev')({})
					]).process(result.css, {
						from:in_file, to:out_file
					}).then(function(result){
						// console.log(result.css);
						fs.writeFile(out_file, result.css, {mode:'777'}, function(){
							console.log(`Compile ${out_file} success`);
							// return next();
						});
						defer.resolve(result.css);
					});
				}
			});
		}
	},
	compile_list_to_writer: function(list, res, next){
		Promise.all(list.map(function(css_path){
			return new Promise(function(resolve, reject){
				var css_dir   = path.normalize(path.dirname(css_path) + '/');
				var scss_dir  = css_dir.replace(/([\\\/])css([\\\/])/, "$1scss$2");
				var scss_path = scss_dir + path.basename(css_path, '.css') + '.scss';
				extension.mkdirRecursive(css_dir, 777, function(){
					var defer = {resolve:resolve, reject:reject};
					extension.sass.node(scss_path, css_path, defer);
				});
			});
		})).then(function(css_ret){
			res.end(css_ret.join("\n"));
		})['catch'](function(e){
			console.log(e);
		});
		return true;
	},
	CompileSCSS: function(req, res, next){
		if(/.*\.css$/.test(req.path)){
			var css_path = path.normalize(extension.static_dir + req.path);
			res.writeHead(200, {"Content-Type":'text/css'});
			extension.compile_list_to_writer([css_path], res);
		}else{
			next();
		}
		return true;
	},
	minify_code: function(s){
		s = s.replace(/(\/?>)\s+|\s+(?=<)/g, '$1');
		// s = s.replace(/\\/g, "\\\\");
		s = s.replace(/\s*([\r\n]+)\s*/g, '$1');
		// s = s.replace(/([^\\])(')/g, "$1\\$2"); // '
		return s;
	},
	merge_tpl_list: function(list, out_file, next){
		var data = {};
		try{
			list.forEach(function(one){
				var s = fs.readFileSync(one, {encoding:'utf8', flag:'r'});
				if(-1!==['tpl', 'ejs', 'html', 'htm'].indexOf(path.extname(one).slice(1))){
					s = extension.minify_code(s);
				}
				data[path.basename(one)] = s;
			});
			fs.writeFile(out_file, "define("+JSON.stringify(data)+");", {mode:'777'}, function(){
				return next&&next();
			});
		}catch(e){
			console.log(e);
			next&&next();
		}
		return true;
	},
	CompileDir2JS: function(dir){
		return new Promise(function(resolve, reject){
			extension.dir_compile(dir, {resolve:resolve, reject:reject});
		}).then(function(data){
			data = Array.prototype.concat.apply([], data).filter(function(i){ return i;});
			return Promise.resolve(data);
		});
	},
	dir_compile: function(dir, defer){
		fs.readdir(extension.static_dir + dir, function(err, files){
			files.length && Promise.all(files.map(function(one){
				return new Promise(function(resolve, reject){
					var file_path = dir + one;
					fs.stat(extension.static_dir+file_path, function(err, stats){
						if(stats.isDirectory()){
							extension.dir_compile(file_path+'/', {resolve:resolve, reject:reject});
						}else{
							if('.json'!==path.extname(file_path)){
								var req = {path:path.normalize(file_path.replace(/([\\\/])htpl([\\\/])/, "$1tpl$2")+'.js').replace(/\\/g, '/')};
								extension.Compile2JS(req, {});
								resolve(path.normalize(extension.static_dir + file_path));
							}
							resolve(null);
						}
					});
				});
			})).then(defer.resolve);
		});
	},
	/*
	 * 每次请求模块文件时，动态编译相应的模块文件
	 * 具有合并多个模块文件为一个的功能
	 * */
	Compile2JS: function(req, res, next){
		if(!/\/tpl\/.*\.js$/.test(req.path)) return next&&next();
		var out_file   = path.normalize(extension.static_dir + req.path);
		var out_path   = path.normalize(path.dirname(out_file) + '/');
		var in_path    = path.normalize(out_path.replace(/([\\\/])tpl([\\\/])/, "$1htpl$2"));
		var in_file    = in_path + path.basename(out_file, '.js');
		var path_patch = in_file.split(/([\\\/])(htpl)([\\\/])/).slice(0, 4)
		path_patch.push('map.json');
		extension.mkdirRecursive(out_path, 777, function(){
			var map  = extension.readJSONFile(path_patch.join(''));
			var list = [], stpl;
			if(stpl = map[req.path.replace(/\.js$/,'').slice(1)]){ // 多模块合并
				stpl.split(',').forEach(function(one){
					list.push(out_path.replace(/([\\\/])tpl([\\\/])/, "$1htpl$2") + one + '.tpl');
				});
			}else{
				list.push(in_file);
			}
			extension.merge_tpl_list(list, out_file, next);
		});
		return true;
	}
};
module.exports = extension;
