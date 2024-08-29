// ==UserScript==
// @name         Stasi
// @version      0.1.0
// @description  开门，契卡！
// @match        http://aiportal.unicom.local/portal/v1/page/modules/news/*
// @run-at       document-end
// @updateURL    https://weaponhub.pages.dev/stasi.user.js
// @downloadURL  https://weaponhub.pages.dev/stasi.user.js
// ==/UserScript==

(function () {
    'use strict'
    setInterval(() => {
        const isCommentListShow = $.find(".comment-list").length != 0
        if (isCommentListShow) {
            $.find(".reply-items").forEach((item) => {
                if (item.textContent.includes("上述言论发言人：") === false) {

                    const name = item.attributes["data-fromnickname"].value;
                    const id = item.attributes["data-fromuid"].value;
                    const replyTo = item.attributes["data-tonickname"].value;

                    item.children[1].append("【上述言论发言人：" + name + "; oa账号" + id + ";" + "回复给：" + replyTo + "】");
                } else {
                    return
                }
            });
        }
    }, 4000)

    const originOpen = XMLHttpRequest.prototype.open;

    XMLHttpRequest.prototype.open = function (_, url) {
        if (url.indexOf("pcm/comment/v1/page") != -1) {
            console.log("hijack！！！！！");
            const xhr = this;
            const getter = Object.getOwnPropertyDescriptor(
                XMLHttpRequest.prototype,
                "response"
            ).get;

            Object.defineProperty(xhr, "responseText", {
                get: () => {
                    let result = getter.call(xhr);
                    try {
                        const res = JSON.parse(result);
                        const data = res.data.list;
                        data.forEach((itemList) => {
                            console.log(itemList.content, itemList.nickName, itemList.commentId);

                        });

                        return JSON.stringify(res);
                    } catch (e) {
                        return result;
                    }
                },
            });
        }
        originOpen.apply(this, arguments);

    };
})();
