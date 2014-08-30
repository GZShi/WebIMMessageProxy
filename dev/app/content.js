// version: 2014/08/27 18:18

(function (global) {

chrome.extension.sendRequest({
	type: 'login',
	text: ''
}, function (res) {
	if(res.text != 'ok') return ;

	var sender = new SendControl(location.host, {
		times: 0,
		interval: [1000, 1000],
		order: 'seq',
		list: []
	});

	function x_send(obj) {
		sender.stop();
		sender.reset(location.host, obj);
		sender.begin();
	}

	chrome.extension.onRequest.addListener(function (req, sender, sendRes) {
		if(req.type == 'new message') {
			sender.send(req.text);
		} else {
			console.log('未知消息: ');
			console.log(req);
		}
	});
})

var MessageListener = (function () {

	function getMsgContainer(type) {
		switch(type) {
			case 'weibo.com': return document.querySelector('div.webim_chat_dialogue');
		}
	}

	function listener() {
		var that = this;

		function getDom () {
			that.dom = getMsgContainer(location.host);
			if(!that.dom) {
				setTimeout(getDom, 1000);	// 如果没有dom，则过一秒再重新获取
				return ;
			}

			that.dom.addEventListener('scroll', function () {
				
			})

		}

		this.callbacks = [];
	}
})();



var SendControl = (function () {

	function getTextNode(type) {
		// web2.qq.com 支持多窗口，不易获取
		switch(type) {
			case 'w.qq.com': return document.querySelector('#chat_textarea');
			case 'wx2.qq.com': return document.querySelector('#textInput');
			case 'weibo.com': return document.querySelector('textarea.sendbox_area')
			default: return {};
		}
	}

	function getSendBtn(type) {
		switch(type) {
			case 'w.qq.com': return document.querySelector('#send_chat_btn');
			case 'wx2.qq.com': return document.querySelector('#chat_editor').querySelector('a.chatSend');
			case 'weibo.com': return document.querySelector('a.WBIM_btn_a');
			default: return {click: function () {}};
		}
	}


	function createGetMsgFunc(param) {
		var list = [];
		for(var i = 0; i < param.list.length; ++i) {
			if(param.list[i].checked) {
				list.push(param.list[i].text);
			}
		}
		var index = 0;
		switch(param.order) {
			case 'random': return function () {
				return list[Math.floor(Math.random() * list.length)];
			};
			case 'seq': return function () {
				try {
					return list[index];
				} catch(e) {} finally {
					index += 1;
					if(index >= list.length) index = 0;
				}
			};
			default: return function () {
				return list[0];
			}
		}
	}

	function createIntervalFunc(param) {
		var min = Math.min.apply(this, param.interval);
		var max = Math.max.apply(this, param.interval);

		if(min == max) {
			return function () {
				return min;
			}
		} else {
			return function () {
				return min + (max - min) * Math.random();
			}
		}
	}

	function send(type, param) {
		var that = this;
		this.run = true;
		this.pause = true;
		this.param = param;
		this.times = param.times;
		this.textNode = getTextNode(type);
		this.sendBtn = getSendBtn(type);
		this.getMsg = createGetMsgFunc(param);
		this.interval = createIntervalFunc(param);
		this.callbacks = [];
	}

	send.prototype = {
		begin: function () {
			if(this.run != true || this.pause == false || this.times <= 0) return;
			var that = this;
			this.send(this.getMsg());
			setTimeout(function () {
				that.begin();
			}, this.interval());
			this.times -= 1;
		},

		pause: function () {
			this.pause = true;
		},

		stop: function () {
			this.run = false;
		},

		send: function (text) {
			this.textNode.value = text;
			this.sendBtn.click();
		},

		reset: function (type, param) {
			this.run = true;
			this.pause = true;
			this.param = param;
			this.times = param.times;
			this.textNode = getTextNode(type);
			this.sendBtn = getSendBtn(type);
			this.getMsg = createGetMsgFunc(param);
			this.interval = createIntervalFunc(param);
			this.callbacks = [];
		},

		onMessage: function (callback) {
			this.callbacks.push(callbacks);
		}
	}

	return send;
})();


})(window);
