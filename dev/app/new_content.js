
var configList = {
	'wx2.qq.com': {
		host: 'wx2.qq.com',
		dialogContainer: 'div#chat_chatmsglist',	// 用于监听 DOMNodeInserted 事件
		newMessageClass: 'you',						// 用于判断对话是自己说的还是对方说的
		newMessageContainer: 'pre',					// 对方说话的文本内容
		textarea: 'textarea#textInput',				// 输入框
		sendButton: 'a.chatSend'					// 发送按钮
	},

	// web2.qq.com 的聊天窗口不唯一，所以暂不支持
	// w.qq.com 就是和微信非常像的那个版本
	'w.qq.com': {
		host: 'w.qq.com',
		dialogContainer: 'div#panelBody-5',
		newMessageClass: 'buddy',
		newMessageContainer: 'p.chat_content',
		textarea: 'textarea#chat_textarea',
		sendButton: 'button#send_chat_btn'
	},

	'weibo.com': {
		host: 'weibo.com',
		dialogContainer: 'div.webim_dia_list',
		newMessageClass: 'webim_dia_l',
		newMessageContainer: 'p.dia_txt',
		textarea: 'div.sendbox_box textarea',
		sendButton: 'div.sendbox_btn a.WBIM_btn_a'
	}
};


var config = configList[location.host];
if(!config) return;

var Server = (function () {
	function factory(config) {
		this.config = config;
		this.status = false;

		this.textarea = null;
		this.sendButton = null;

		// 由于 w.qq.com 每次都是使用模板填充 container
		// 导致每次新的消息都会重复触发老消息的 DOMNodeInserted 事件
		// 所以用这个来判断当前插入事件是否是新节点插入
		this.msgListCount = -1;

		// 和插件进行通信的通道
		this.port = null;

		// 消息转发规则
		this.rules = null;
	}

	// 负责监听当前页面用户是否已经进入聊天界面
	// weibo	只有用户进入聊天界面，对应的选择器才会出现。
	//			BUG: 只能监听第一个聊天对象，因为每个聊天对象都是独立的容器
	//			     容器的className相同，但是hidden属性不同
	// weixin	当选择好友时才能获取容器，不同聊天对象共用一个容器
	// webqq	同 weixin
	factory.prototype.listen = function () {
		if(this.status == 'ok') return ;	// 防止重复监听。这个判断待商榷，重复监听可以解决weibo多窗口的问题 TODO
		var self = this;

		function getDom(selector, callback) {
			var target = document.querySelector(selector);
			if(target) {
				callback(target);
			} else {
				setTimeout(getDom, 1000, selector, callback);
			}
		}

		getDom(self.config.dialogContainer, function (target) {
			// 获取到容器了
			// 稍等1000ms，等历史消息载入结束后再监听消息，避免把历史消息当做新消息
			setTimeout(function () {

				// 向background.js注册
				chrome.extension.sendRequest({
					type: 'regist',
					data: ''
				}, function (res) {
					if(res.text != 'ok') return;	// 和 background.js 约定，ok 为成功标识
					self.status = 'ok';
					self.name = res.name;			// 用于标识通道(port)

					// 监听来自服务器的消息
					// 通过监听 DOM 消息列表的插入事件来模拟新消息
					target.addEventListener('DOMNodeInserted', function (event) {
						// 上面提到的，w.qq.com不是增量添加消息，每次都会重复插入
						if(target.childElementCount <= self.msgListCount) return;
						self.msgListCount = target.childElementCount;

						var newNode = event.target;		// 新增加的节点
						var className = newNode.className;

						// 通过新标签的class判断是不是新消息(排除时间戳和自己的消息)
						if(!className) return;
						if(className.indexOf(self.config.newMessageClass) < 0) return;

						var message = newNode.querySelector(self.config.newMessageContainer).innerText.trim();
						if(message.length <= 0) message = ">_<";

						// 获取新的消息后，马上通过专用port告诉插件 TODO
						self.port.postMessage({
							type: 'new message',
							text: message,
							name: self.name
						});
					});


					// 监听来自插件的发送指令 TODO
					x_port = self.port = chrome.runtime.connect({name: self.name});
					self.port.onMessage.addListener(function (msg, sender) {
						if(self.status != 'ok') return;
						if(msg.type == 'new message') {
							self.send(msg.text);
						}
					});


					// 获取其它DOM节点
					// 因为这两个节点一定能查询到(?)，所以就使用 getDom 进行查询
					self.textarea = document.querySelector(self.config.textarea);
					self.sendButton = document.querySelector(self.config.sendButton);
				})

			}, 1000);
		});
	};


	factory.prototype.send = function (text) {
		if(this.status != 'ok') return;
		if(!this.textarea ||  !this.sendButton) return;

		this.textarea.value = text;
		this.sendButton.click();
	}

	factory.prototype.loadChatRule = function (rules) {
		this.rule = rules;
	}

	return factory;
})();


var imServer = new Server(config);

imServer.listen();
