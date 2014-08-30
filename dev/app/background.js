var chatMembers = [];
var queryMap = {};

chrome.extension.onRequest.addListener(function (req, sender, sendRes) {
	console.log('Background receive a request');
	console.log(req);
	console.log(sender);

	switch(req.type) {
	case 'regist': {
		var name = 'whiteblue_' + Math.random().toString(16).substr(2);

		// 将随机名字返回给具体页面
		sendRes({
			type: 'regist res',
			text: 'ok',
			name: name
		});

		// 保存信息
		queryMap[name] = {
			name: name,
			port: null
		};
		chatMembers.push(queryMap[name]);
	} break;

	case 'new message': {
	} break;

	default: break;
	}
});


// 收到来自 content script 的通道请求
chrome.runtime.onConnect.addListener(function (port) {
	console.log('background on connect');
	console.log(port);

	port.onMessage.addListener(function (msg, sender) {
		debugger;

		if(msg.type == 'new message') {
			for(var i = 0, len = chatMembers.length; i < len; ++i) {
				if(chatMembers[i].name == port.name) continue;
				chatMembers[i].port.postMessage({
					type: 'new message',
					text: msg.text
				});
			}
		}
	});

	port.onDisconnect.addListener(function () {
		debugger;

		for(var i = 0, len = chatMembers.length; i < len; ++i) {
			if(chatMembers[i].name == port.name) {
				chatMembers.splice(i, 1);
				break;
			}
		}

		delete queryMap[port.name];
	});

	queryMap[port.name].port = port;
});