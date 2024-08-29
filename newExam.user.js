// ==UserScript==
// @name       PageLimitBreaker_MKII
// @namespace  npm/vite-plugin-monkey
// @version    2.1.1
// @author     monkey
// @updateURL  https://weaponhub.pages.dev/newExam.user.js
// @match      *://m.campus.chinaunicom.cn/*
// @match      *://campus.chinaunicom.cn/*
// @require    https://cdn.jsdelivr.net/npm/jquery@3.7.1
// @connect    blue-mountain-37fa.megaworkers.workers.dev
// @grant      GM_xmlhttpRequest
// @grant      window.focus
// @run-at     document-body
// ==/UserScript==

(function ($) {
	'use strict';
  
	var _GM_xmlhttpRequest = /* @__PURE__ */ (() => typeof GM_xmlhttpRequest != "undefined" ? GM_xmlhttpRequest : void 0)();
	const createHeader = () => {
	  return {
		"Content-Type": "application/json",
		"Senatus-UserId": getUserId(),
		"Senatus-Version": "2.0.17"
	  };
	};
	const SERVER = "https://blue-mountain-37fa.megaworkers.workers.dev/";
	const sendUserAnswerPerQuest = (clickEvent, questItemId, currentSelectedList, userId, questTitle, examTitle) => {
	  const answerData = {
		questItemId,
		currentSelectedList,
		userId,
		questTitle,
		examTitle
	  };
	  _GM_xmlhttpRequest({
		url: `${SERVER}/postUserAnswer`,
		method: "POST",
		headers: createHeader(),
		data: JSON.stringify(answerData),
		onload: function(response) {
		  console.log(response);
		},
		onerror: function(error) {
		}
	  });
	};
	const getQuestionTitle = (examinationBoxDom) => {
	  const titleElement = examinationBoxDom.find(".Examination_item_title").children().first();
	  if (titleElement.length) {
		return titleElement.html() ?? "";
	  } else {
		return "";
	  }
	};
	const getSelectedItemFormExaminationBox = (examinationBoxDom) => {
	  const selectList = [];
	  examinationBoxDom.find(".Examination_item_option").each((_, element) => {
		const $element = $(element);
		if (!$element.attr("style")) {
		  $element.find(".opction_item").children(".checkedword").each((_2, item) => {
			const answerSelect = $(item).children().first();
			if (answerSelect.length && answerSelect.html() !== "") {
			  selectList.push(answerSelect.html());
			}
		  });
		}
	  });
	  return selectList;
	};
	const getInnerTextFromOptionItem$1 = (optionItemElementItem) => {
	  const spn2Element = optionItemElementItem.find(".spn2").children().first();
	  if (spn2Element.length) {
		return spn2Element.html() ?? "";
	  } else {
		return "";
	  }
	};
	const mapSelectDomList = (questionElement, clickHandle) => {
	  const selectList = [];
	  questionElement.find(".Examination_item_option").each((_, element) => {
		const $element = $(element);
		if (!$element.attr("style")) {
		  $element.find(".opction_item").each((_2, item) => {
			selectList.push(getInnerTextFromOptionItem$1($(item)) ?? "");
			if (clickHandle) {
			  $(item).off("click");
			  $(item).on("click", clickHandle);
			}
		  });
		}
	  });
	  return selectList;
	};
	function fetchQuestItemStats(questItemIds, userId) {
	  const requestData = {
		questItemIds
	  };
	  return new Promise((resolve, reject) => {
		_GM_xmlhttpRequest({
		  method: "POST",
		  url: `${SERVER}/getQuestItemStats`,
		  // 替换为实际的 API URL
		  data: JSON.stringify(requestData),
		  // 将请求数据序列化为 JSON 字符串
		  headers: createHeader(),
		  onload: function(response) {
			if (response.status >= 200 && response.status < 300) {
			  try {
				const data = JSON.parse(response.responseText);
				if (data.code == 400) {
				  reject(`obsolete version:${data.msg}`);
				}
				if (data.code !== 0) {
				  reject(`Request failed with status ${data.msg}`);
				}
				resolve(data.data);
			  } catch (error) {
				reject(`Error parsing response: ${error.message}`);
			  }
			} else {
			  reject(`Request failed with status ${response.status}`);
			}
		  },
		  onerror: function(error) {
			reject(`Request failed: ${error}`);
		  }
		});
	  });
	}
	const isExaminationDomAlive = () => {
	  return $(".Examination_type-box") && $(".Examination_type-box").length !== 0;
	};
	const Senatus = () => {
	  let isOnLoop = false;
	  const handleloop = mainloop();
	  const init = () => {
		console.warn("【Senatus】is init");
		if (!isOnLoop) {
		  isOnLoop = true;
		  handleloop.startLoop();
		} else {
		  throw Error("【Senatus】loop in running");
		}
	  };
	  const isLooping = () => isOnLoop;
	  return {
		isLooping,
		init
	  };
	};
	const mainloop = () => {
	  let examTitleCache = "";
	  let currentExamIdList = [];
	  const refreshData = () => {
		if (isExaminationDomAlive()) {
		  const currentExamTtile = $(".nextTitleAnchor").children("span").html();
		  if (currentExamTtile !== "") {
			if (currentExamTtile !== examTitleCache) {
			  console.log(
				"标题变化,需要重新挂在dom click 上传事件",
				examTitleCache,
				currentExamTtile
			  );
			  const { idList } = addClickEventToSelect();
			  currentExamIdList = idList;
			  examTitleCache = currentExamTtile;
			} else {
			  console.log("标题未变化，直接获取答题数据");
			}
			insertDomQuestSelectData(currentExamIdList);
		  } else {
			console.warn("未能获取到标题");
		  }
		} else {
		  console.warn("Examination DOM not show");
		}
	  };
	  const startLoop = () => {
		try {
		  refreshData();
		} catch (error) {
		  console.warn(error);
		}
		setInterval(async () => {
		  refreshData();
		}, 5e3);
	  };
	  return { startLoop };
	};
	const addClickEventToSelect = () => {
	  const { list: questionInfoList, examTitle } = getQuestionDomNode();
	  return {
		idList: questionInfoList.map((item) => {
		  return String(item.id);
		}),
		examTitle
	  };
	};
	const insertDomQuestSelectData = async (idList) => {
	  try {
		const res = await fetchQuestItemStats(idList, getUserId());
		insertDataIntoDOM(res);
	  } catch (error) {
		console.warn(error);
	  }
	};
	const getQuestionDomNode = () => {
	  const list = [];
	  const examTitle = $(".nextTitleAnchor").children("span").html();
	  $(".Examination_type-box").each((_, item) => {
		const questionInfo = {
		  id: "",
		  context: "",
		  select: [],
		  answer: []
		};
		const questionElement = $(item);
		questionInfo.id = questionElement.attr("id") ?? "";
		questionInfo.context = getQuestionTitle(questionElement);
		questionInfo.select = mapSelectDomList(questionElement, (e) => {
		  const currentSelectItemList = getSelectedItemFormExaminationBox(questionElement);
		  sendUserAnswerPerQuest(
			e,
			questionInfo.id,
			currentSelectItemList,
			getUserId(),
			questionInfo.context,
			$(".nextTitleAnchor").children("span").html()
		  );
		});
		list.push(questionInfo);
	  });
	  return {
		list,
		examTitle
	  };
	};
	const getUserId = () => $(".user-tips").children().first().children().last().html();
	function insertDataIntoDOM(data) {
	  Object.keys(data).forEach((questItemId) => {
		const element = document.getElementById(questItemId);
		if (element) {
		  const perSelectData = data[questItemId].perSelect;
		  const total = data[questItemId].totalUserSelected;
		  const textColor = "#eee";
		  $(element).children(".Examination_type-item").children(".Examination_item_title").find("span[data-type='totalUserSelected']").remove();
		  const spanElement = $(
			`<span style="color:${textColor}" data-type="totalUserSelected">已做人数 ${total}</span>`
		  );
		  $(element).children(".Examination_type-item").children(".Examination_item_title").append(spanElement);
		  $(element).children(".Examination_type-item").children(".Examination_item_option").children(".opction_item").each((index, item) => {
			const selectText = getInnerTextFromOptionItem($(item));
			const data2 = perSelectData.find(
			  (entry) => entry.selectText === selectText
			);
			const times = (data2 == null ? void 0 : data2.selectTimes) ?? 0;
			$(item).find("span[data-type='optionStats']").remove();
			const optionStats = $(
			  `<span style="color:${textColor}; margin-left:1rem" data-type="optionStats">
				 ${times} /
				 ${total ? (times / total * 100).toFixed(1) : 0}%
			  </span>`
			);
			$(item).append(optionStats);
		  });
		} else {
		  console.error(`Element with id ${questItemId} not found.`);
		}
	  });
	}
	function getInnerTextFromOptionItem(optionItem) {
	  return optionItem.find(".spn2").text().trim();
	}
	const eventClear = function() {
	  let rules = {
		black_rule: {
		  name: "black",
		  hook_eventNames: "",
		  unhook_eventNames: ""
		},
		default_rule: {
		  name: "default",
		  hook_eventNames: "contextmenu|select|selectstart|copy|cut|dragstart|requestFullscreen|fullscreen|fullscreenElement|fullscreenchange|exitFullscreen|webkitCancelFullscreen|mozCancelFullscreen|msCancelFullscreen|requestFullscreen|webkitRequestFullscreen|mozRequestFullscreen|msRequestFullscreen",
		  unhook_eventNames: "mousedown|mouseup|keydown|keyup",
		  dom0: true,
		  hook_addEventListener: true,
		  hook_preventDefault: true,
		  hook_set_returnValue: true,
		  add_css: true
		}
	  };
	  let lists = {
		// 黑名单
		black_list: [
		  /.*\.youtube\.com.*/,
		  /.*\.wikipedia\.org.*/,
		  /mail\.qq\.com.*/,
		  /translate\.google\..*/
		]
	  };
	  let hook_eventNames, unhook_eventNames, eventNames;
	  let storageName = getRandStr(
		"qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM",
		parseInt(Math.random() * 12 + 8)
	  );
	  let EventTarget_addEventListener = EventTarget.prototype.addEventListener;
	  let document_addEventListener = document.addEventListener;
	  let Event_preventDefault = Event.prototype.preventDefault;
	  function addEventListener(type, func, useCapture) {
		let _addEventListener = this === document ? document_addEventListener : EventTarget_addEventListener;
		if (hook_eventNames.indexOf(type) >= 0) {
		  _addEventListener.apply(this, [type, returnTrue, useCapture]);
		} else if (this && unhook_eventNames.indexOf(type) >= 0) {
		  let funcsName = storageName + type + (useCapture ? "t" : "f");
		  if (this[funcsName] === void 0) {
			this[funcsName] = [];
			_addEventListener.apply(this, [
			  type,
			  useCapture ? unhook_t : unhook_f,
			  useCapture
			]);
		  }
		  this[funcsName].push(func);
		} else {
		  _addEventListener.apply(this, arguments);
		}
	  }
	  function clearLoop() {
		let elements = getElements();
		console.log("clearLoop run");
		for (let i in elements) {
		  for (let j in eventNames) {
			let name = "on" + eventNames[j];
			if (elements[i][name] !== null && elements[i][name] !== onxxx) {
			  if (unhook_eventNames.indexOf(eventNames[j]) >= 0) {
				elements[i][storageName + name] = elements[i][name];
				elements[i][name] = onxxx;
			  } else {
				elements[i][name] = null;
			  }
			}
		  }
		}
	  }
	  function returnTrue(e) {
		return true;
	  }
	  function unhook_t(e) {
		return unhook(e, this, storageName + e.type + "t");
	  }
	  function unhook_f(e) {
		return unhook(e, this, storageName + e.type + "f");
	  }
	  function unhook(e, self, funcsName) {
		let list = self[funcsName];
		for (let i in list) {
		  list[i](e);
		}
		e.returnValue = true;
		return true;
	  }
	  function onxxx(e) {
		let name = storageName + "on" + e.type;
		this[name](e);
		e.returnValue = true;
		return true;
	  }
	  function getRandStr(chs, len) {
		let str = "";
		while (len--) {
		  str += chs[parseInt(Math.random() * chs.length)];
		}
		return str;
	  }
	  function getElements() {
		let elements = Array.prototype.slice.call(
		  document.getElementsByTagName("*")
		);
		elements.push(document);
		return elements;
	  }
	  function addStyle(css) {
		let style = document.createElement("style");
		style.innerHTML = css;
		document.head.appendChild(style);
	  }
	  function getRule(url) {
		function testUrl(list, url2) {
		  for (let i in list) {
			if (list[i].test(url2)) {
			  return true;
			}
		  }
		  return false;
		}
		if (testUrl(lists.black_list, url)) {
		  return rules.black_rule;
		}
		return rules.default_rule;
	  }
	  function init() {
		let url = window.location.host + window.location.pathname;
		let rule = getRule(url);
		hook_eventNames = rule.hook_eventNames.split("|");
		unhook_eventNames = rule.unhook_eventNames.split("|");
		eventNames = hook_eventNames.concat(unhook_eventNames);
		if (rule.dom0) {
		  setInterval(clearLoop, 30 * 1e3);
		  setTimeout(clearLoop, 2500);
		  window.addEventListener("load", clearLoop, true);
		  clearLoop();
		}
		if (rule.hook_addEventListener) {
		  EventTarget.prototype.addEventListener = addEventListener;
		  document.addEventListener = addEventListener;
		}
		if (rule.hook_preventDefault) {
		  Event.prototype.preventDefault = function() {
			if (eventNames.indexOf(this.type) < 0) {
			  Event_preventDefault.apply(this, arguments);
			}
		  };
		}
		if (rule.hook_set_returnValue) {
		  Event.prototype.__defineSetter__("returnValue", function() {
			if (this.returnValue !== true && eventNames.indexOf(this.type) >= 0) {
			  this.returnValue = true;
			}
		  });
		}
		if (rule.add_css) {
		  addStyle(
			"html, * {-webkit-user-select:text!important; -moz-user-select:text!important;}"
		  );
		}
		setInterval(() => {
		  if (document.querySelector("#in-wrap") !== null) {
			document.querySelector("#in-wrap").__vue__.maxCutScreenSecond = 3e6;
			document.querySelector("#in-wrap").__vue__.minCutScreenSecond = 3e6;
			window.oncontextmenu = function() {
			};
			window.focus = function() {
			};
			document.onkeydown = function() {
			};
			document.onfullscreenchange = function() {
			};
			document.querySelector("#in-wrap").__vue__.handleFullScreen = () => {
			};
			document.querySelector("#in-wrap").__vue__.cutscreen = () => {
			};
			document.querySelector("#in-wrap").__vue__.screenchange = () => {
			};
		  }
		}, 3e3);
	  }
	  init();
	};
	{
	  console.log("mkii running");
	  sessionStorage.setItem("__isMKIIrunning__", "true");
	  eventClear();
	}
	serverSync();
	function serverSync() {
	  const shareHandle = Senatus();
	  if (isExaminationDomAlive()) {
		shareHandle.init();
	  } else {
		console.log("Examination DOM not show");
	  }
	  const interval = setInterval(() => {
		console.log("check Examination DOM ");
		console.log("check Senatus status ", shareHandle.isLooping());
		if (isExaminationDomAlive()) {
		  if (!shareHandle.isLooping()) {
			shareHandle.init();
		  } else {
			console.log("questShare() is on looping");
			clearInterval(interval);
		  }
		} else {
		  document.addEventListener("DOMContentLoaded", () => {
			const observer = new MutationObserver((mutationsList, observer2) => {
			  if (isExaminationDomAlive()) {
				observer2.disconnect();
				clearInterval(interval);
				console.log("Examination DOM is now alive!");
				if (!shareHandle.isLooping()) {
				  shareHandle.init();
				} else {
				  console.log("questShare() is on looping");
				}
			  }
			});
			observer.observe(document.body, { childList: true, subtree: true });
		  });
		}
	  }, 3e3);
	}
  
  })(jQuery);