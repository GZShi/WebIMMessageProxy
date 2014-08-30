window.onload = function () {
	var config = load();
	$('input#interval-min').val(config.interval[0]);
	$('input#interval-max').val(config.interval[1]);
	$('input#message-order-' + config.order)[0].checked = true;
	$('input#send-times').val(config.times);
	fillList(config.list);
	$('input').on('change', onInputChange);
	$('#btn-send').on('click', send);
	$('#add-msg-btn').on('click', onAddItem);
	onInputChange();
}

// 获取唯一ID
var getUID = (function () {
	var id = 1;
	return function () {
		return id++;
	}
})();

// save & load
// 操作 localStorage 进行本地存储操作
function save(config) {
	localStorage.setItem('config', JSON.stringify(config));
}

function load() {
	var defaultConfig = {
		"interval": [500, 1000],
		"order": "random",
		"times": 10,
		"list": [{
			"text": "Author:GZShi",
			"checked": true
		}, {
			"text": "不要骚扰别人哟",
			"checked": true
		}, {
			"text": "点击左边复选框才会被发送",
			"checked": true
		}, {
			"text": "点击右边按钮可以删除我",
			"checked": false
		}]
	};

	var configString = localStorage.getItem('config') || '}';
	var rtn ;
	try {
		rtn = JSON.parse(configString);
	} catch (e) {
		rtn = defaultConfig;
	}
	return rtn;
}


// 添加新消息时
function onAddItem() {
	var text = document.querySelector('#add-msg-input').value;
	text = text.trim();
	if(text.length > 0) {
		appendMsg(text);
		document.querySelector('#add-msg-input').value = '';
	}
}

// 监听用户输入状态，并给出对应的提示
function onInputChange () {
	var content = getListData();
	saveAllData(content);
	var spanTips = document.querySelector('#span-tips');
	if(content.trueCount > 0) {
		spanTips.innerText = '现在可以发送了';
		spanTips.className = 'text-tips';
		document.querySelector('#btn-send').disabled = false;
	} else {
		if(content.falseCount > 0) {
			spanTips.innerText = '请至少选择一条消息';
			spanTips.className = 'text-warn';
		} else {
			spanTips.innerText = '先添加一条待发消息';
			spanTips.className = 'text-tips';
		}
		document.querySelector('#btn-send').disabled = true;
	}
}

// 将当前的内容保存
// content 是消息列表，可为空
function saveAllData (content) {
	var order = $('input[name="message-order"]');
	for(var i = 0; i < order.length; ++i) {
		if(order[i].checked == true) {
			order = order[i].value;
			break;
		}
	}
	var config = {
		"interval": [$('input#interval-min').val(), $('input#interval-max').val()],
		"order": order,
		"times": $('input#send-times').val(),
		"list": []
	};

	config.list = (content || getListData()).list;
	save(config);
}

// 从 DOM 中获取所有的消息以及选择状态
function getListData() {
	var content = {
		trueCount: 0,
		falseCount: 0,
		list: []
	};
	var listDom = document.querySelectorAll('div.msg-list-item');
	for(var i = 0; i < listDom.length; ++i) {
		var text = listDom[i].querySelectorAll('label')[0].innerText;
		var checked = listDom[i].querySelectorAll('input')[0].checked;
		if(checked) content.trueCount++;
		else content.falseCount++;
		content.list.push({
			text: text,
			checked: checked
		});
	}

	return content;
}

// 消息列表右边的删除按钮事件
function bindDelBtnEvent(id) {
	var node = document.querySelector('#' + id);
	var container = node.parentNode.parentNode;
	node.addEventListener('click', function () {
		container.parentNode.removeChild(container);
		onInputChange();
	});
}

// 填充消息列表 DOM
function fillList(list) {
	var listContainer = document.querySelector('#msg-list');

	var tpl = document.querySelector('#msg-list-item-tpl');
	var checkbox = tpl.content.querySelectorAll('input')[0];
	var label = tpl.content.querySelectorAll('label')[0];
	var button = tpl.content.querySelectorAll('button')[0];

	for(var i = 0; i < list.length; ++i) {
		var uid = getUID();
		var item = list[i];
		checkbox.checked = item.checked;
		checkbox.setAttribute('id', 'msg-list-input-' + uid);
		label.setAttribute('for', checkbox.id);
		label.innerText = item.text;
		button.setAttribute('id', 'msg-list-btn-' + uid);

		var clone = document.importNode(tpl.content, true);
		listContainer.appendChild(clone);
		bindDelBtnEvent(button.id);
	}
}

// 往消息列表里面添加消息
function appendMsg(text, checked) {
	if(checked == undefined) checked = true;

	fillList([{
		checked: checked,
		text: text
	}]);
	saveAllData();
}



function send() {
	// 通知页面进行操作
	// chrome.tabs.executeScript(null, {
	// 	code: 'x_send(' + JSON.stringify(load()) + ');'
	// });

	// TODO
	// 
}
