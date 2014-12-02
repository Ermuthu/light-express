(function($){
"use strict";
$.fn.window = function(options){
	var type = $.type(options);
	if(type==='string'){
		this.each(function(){
			var ui = $(this).data('ui');
			if(ui&&ui.iWindow){
				$(this).data('ui').iWindow[options]();
			}else{
				throw new Error('UI:window does not init...');
				return false;
			}
		});
		return true;
	}
	options = $.extend(true, {
		title: '',
		show: false,
		footer: {}
	}, options);
	var handler = function(box, options){ return new handler.prototype.init(box, options); };
	handler.prototype = {
		init: function(box, options){
			var $box = $(box);
			var footer = options.footer.formatter ?
				'<div class="bar footer cf">' + options.footer.formatter() + '</div>'
				: '';
			var ctn = '\
<div class="window-ctn imgc">\
	<div class="mask"></div>\
	<div class="wrapper imge cf">\
		<div class="bar header cf">\
			<span class="title">' + (options.title||'') + '</span>\
			<a href="javascript:;" class="closer">×</a>\
		</div>\
		<div class="contents"></div>' + footer + '\
	</div>\
	<!--[if lt IE 8]><i class="iecp"></i><![endif]-->\
</div>';
			var w = $(ctn.replace(/>\s+</g, '><')).appendTo(document.body);
			this.userOptions = options;
			this.container   = w.get(0);
			this.render		 = box;
			this.wraper      = $('.wrapper', w).get(0);
			this.closer      = $('.closer', w).get(0);
			this.contents    = $('.contents', w).get(0);
			this.title		 = $('.title', w).html(options.title).get(0);
			$box.show().appendTo(this.contents);
			var that = this;
			$(['Height', 'Width']).each(function(i, one){
				that['getView'+one] = (function () {
					var container = "BackCompat" === document.compatMode ? document.body : document.documentElement;
					return function () {
						return container['client'+one];
					};
				}());
				that['getElement'+one] = function (e) {
					if(!e || e.style.display==='none') return 0;
					return e['offset'+one];
				};
			});

			$(window).resize(function(){that.resize();});
			$(this.closer).on('click', function(e){
				that.close();
				e.preventDefault();
				e.stopPropagation();
				return false;
			});
			if(options.show) this.show();
		},
		show: function(){
			var html = document.documentElement;
			var body = document.body;
			body.children[0].style.width = body.children[0].offsetWidth + 'px';
			var $container = $(this.container),
				$contents  = $(this.contents),
				wraper     = this.wraper;
			var css1compat = document.compatMode === "CSS1Compat";
			var isIE6      = /MSIE 6.0/.exec(navigator.userAgent);
			$([html, body]).css({overflow:'hidden'});
			$container.show();
			var scrollTop = html.scrollTop || window.pageYOffset || body.scrollTop;
			var viewHeight = this.getViewHeight();
			var viewWidth = this.getViewWidth();
			if(isIE6 || !css1compat){
				$container.css({'position':'absolute', 'top':scrollTop});
			}
			var fix_position = function(n){ return n<0?0:n; };
			$contents.css({
				height: (wraper.clientHeight>viewHeight ? viewHeight : wraper.clientHeight)
					- $('.header', wraper).get(0).offsetHeight
					- (this.userOptions.footer.formatter ? $('.footer', wraper).get(0).offsetHeight : 0)
					- (isIE6 || !css1compat ? 0 : parseInt($contents.css('paddingTop')))
					- (isIE6 || !css1compat ? 0 : parseInt($contents.css('paddingBottom')))
			});
			return this;
		},
		resize: function(){
			if( $(document.body).css('overflow')!=='hidden' ) return false;
			var css1compat = document.compatMode === "CSS1Compat";
			var isIE6      = /MSIE 6.0/.exec(navigator.userAgent);
			var viewWidth   = this.getViewWidth(),
				viewHeight  = this.getViewHeight(),
				wraper      = this.wraper,
				$contents   = $(this.contents);
			var fix_position = function(n){ return n<0?0:n; };
			this.contents.style.height = '';
			$contents.css({
				height: (wraper.clientHeight>viewHeight ? viewHeight : wraper.clientHeight)
					- $('.header', wraper).get(0).offsetHeight
					- (this.userOptions.footer.formatter ? $('.footer', wraper).get(0).offsetHeight : 0)
					- (isIE6 || !css1compat ? 0 : parseInt($contents.css('paddingTop')))
					- (isIE6 || !css1compat ? 0 : parseInt($contents.css('paddingBottom')))
			});
			return this;
		},
		close: function(){
			var options = this.userOptions;
			if( options.onBeforeClose
				&& typeof options.onClose==='function'
				&& !options.onBeforeClose() ) return false;
			document.body.children[0].style.width = 'auto';
			this.container.style.display = 'none';
			$([document.documentElement, document.body]).css({overflow:''});
			if(options.onClose && typeof options.onClose==='function') options.onClose();
			return this;
		}
	};
	handler.prototype.init.prototype = handler.prototype;
	return this.each(function(){
		$(this).data('ui', {
			iWindow: handler(this, $.extend({}, options))
		});
	});
};
})(jQuery);
