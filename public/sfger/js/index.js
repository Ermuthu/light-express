define(function(require, exports, module){
	var page = {
		create: function(option){
			document.title = 'Share From Water';
			new EJS({
				text: require('sfger/tpl/index.tpl')['index.tpl']
			}).update(option.app.root, {
				data:{}
			});
			option.next();
		},
		destroy: function(){
		}
	};
	module.exports = page;
});
