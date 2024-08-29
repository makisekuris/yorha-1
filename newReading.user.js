// ==UserScript==
// @name         Minerva
// @version      0.3.2.0
// @author       You
// @description  Salvation lies within|0.3.1.2 采用了新的观察者api MutationObserver，提高了修改已完成时间的准确性，尤其是多个视频条件下。增加更新检测域名，理论上不需要再手动更新待测试||0.3.1.1 根据请求内容快照md5检测问题作了一下hook处理绕过｜添加了少许说明
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @match        https://m.campus.chinaunicom.cn/*
// @run-at       document-start
// @grant        window.close
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @updateURL    https://weaponhub.pages.dev/newReading.user.js
// @downloadURL  https://weaponhub.pages.dev/newReading.user.js

// ==/UserScript==

(function () {
  "use strict";

  const originOpen = XMLHttpRequest.prototype.open;
  // let studytime = 0;
  // let studyDataModelList = [];
  // let flag = false;

  const readme = `

                请认真阅读本协议，本脚本默认您同意遵守以下协议：

                本插件的开发是为了交流学习、解放生产力、通过先进生产力降低工作心智负担、减少本职工作外的工作成本而开发

                在任何情况下，插件作者不对使用本插件直接或间接造成任何不可遇见的的问题及后果承担任何责任，拒绝并谴责一切吃饭砸锅的行为

                本软件是“按原样”提供的，没有任何形式的明示或暗示的保证，包括但不限于适销性、特定用途的适用性和未侵权的保证。

                作者或版权持有人均不对任何直接、间接、意外的、特殊的、惩罚性的或后果性的损害（包括但不限于购买替代货品或服务；使用、数据或利润的损失；或业务中断）无论是由于任何责任推理原因，合同，疏忽或其他原因，而产生的，即使已告知此类损害的可能性。

                如果您对本协议有任何疑问和异议，请立即删除该插件并重新刷新页面。
                `;
  const showText = () => {
    let dialog = document.createElement("div");
    dialog.style.position = "fixed";
    dialog.style.top = 0;
    dialog.style.left = 0;
    dialog.style.right = 0;
    dialog.style.bottom = 0;
    dialog.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    dialog.style.zIndex = 99999999;

    let content = document.createElement("div");
    content.style.position = "absolute";
    content.style.top = "50%";
    content.style.left = "50%";
    content.style.transform = "translate(-50%, -50%)";
    content.style.backgroundColor = "white";
    content.style.padding = "20px";
    content.style.borderRadius = "10px";

    let text = document.createElement("p");
    text.innerText =
      readme + "\n\n请再次仔细阅读用户协议，如果同意请点击确认。";
    content.appendChild(text);

    let button = document.createElement("button");
    button.innerText =
      "确认后插件会在视频可播放时自动开始，如已开始，等待完成提示即可，其他情况在会在暂停播放时触发修改";
    button.style.display = "block";
    button.style.margin = "20px auto";
    button.style.backgroundColor = "#FF5733";
    button.style.color = "white";
    button.style.padding = "10px 20px";
    button.style.borderRadius = "5px";
    button.style.cursor = "pointer";
    button.addEventListener("click", function () {
      dialog.style.display = "none";

      // 重置暂停触发方法
      document.querySelector(
        "#curriculum"
      ).__vue__.$store._mutations.setPlayTime = [editTime];

      const checkVideoDom = setInterval(() => {
        const myVideo = document.getElementById("vjs_video_3_html5_api");
        if (myVideo !== null) {
          // 自动化播放
          if (myVideo.readyState == 4) {
            myVideo.play();
            setTimeout(() => {
              myVideo.pause();
            }, 2000);
            clearInterval(checkVideoDom);
          }
        }
      }, 1000);
    });
    content.appendChild(button);

    dialog.appendChild(content);
    document.body.appendChild(dialog);

    setTimeout(function () {
      button.disabled = false;
      button.innerText = "确认";
    }, 3000);
  };

  XMLHttpRequest.prototype.open = function (_, url) {
    if (url.indexOf("app/front/playkpoint/") != -1) {
      showText();

      //   const xhr = this;
      //   const getter = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, 'response').get;

      //   Object.defineProperty(xhr, 'responseText', {
      //     get: () => {
      //       let result = getter.call(xhr);
      //       try {
      //         const res = JSON.parse(result);
      //         const data = res.entity.kpointList;

      //         data.forEach((element) => {
      //           if (element.courseMinutes * 60 + element.courseSeconds != 0) {
      //             studyDataModelList.push({
      //               time: element.courseMinutes * 60 + element.courseSeconds,
      //               id: element.id,
      //             });
      //           }
      //         });
      //         studytime = maxtime;
      //         console.log('fetch the video time', maxtime);
      //         console.log('computed study time', studytime);
      //         return JSON.stringify(res);
      //       } catch (e) {
      //         return result;
      //       }
      //     },
      //   });
    }
    // if (flag == false && url.indexOf('app/course/playtimeV2') != -1) {
    //   if (url.indexOf('studyTime=' + studytime) == -1) {
    //     const i = JSON.parse(localStorage.getItem('videoMessage'));
    //     const time = i['courseMinutes'] * 60 + i['courseSeconds'];
    //     // studyDataModelList.forEach(async (element, index) => {
    //     //   flag = true;
    //     //   await setTimeout(() => {
    //     //     let re = url;
    //     //     const pattern = /(?<=studyTime=)(([\s\S])*?)(?=&)/;
    //     //     re = re.replace(pattern, element.time < 1000 ? 5000 : element.time);
    //     //     console.log(re);
    //     //     const kpointIdpattern = /(?<=kpointId=)(([\s\S])*?)(?=&)/;
    //     //     re = re.replace(kpointIdpattern, element.id);
    //     //     const xhr = new XMLHttpRequest();
    //     //     xhr.open("POST", re);
    //     //     xhr.send();
    //     //     console.log(element.id + "成功学习" + +element.time + "分钟");
    //     //     if (studyDataModelList.length - 1 == index) {
    //     //       alert("成功学习,关闭页面");
    //     //       window.close();
    //     //     }
    //     //   }, 300);
    //     // });
    //   }
    // }

    originOpen.apply(this, arguments);
  };

  document.addEventListener("DOMContentLoaded", () => {
    const observer = new MutationObserver((mutationsList, observer) => {
      console.log("watch seclist change!");
      if (getVideoDom()) {
        editTime();
      }
    });

    observer.observe(document.querySelector("video"), {
      childList: true,
      subtree: true,
    });
  });

  const getVideoDom = () => document.querySelector("video");

  const editTime = function () {
    const video = getVideoDom();
    const videoWatchData =
      document.querySelector("#curriculum").__vue__.$store.state.playtimeData;
    videoWatchData.studyTime = Math.ceil(
      video.duration + Math.random() * (30 - 15)
    );
    videoWatchData.breakpoint = Math.ceil(
      video.duration + Math.random() * (30 - 15)
    );
    if (videoWatchData.studyTime >= video.duration) {
      console.log("已将当前视频修改学习时间至：" + videoWatchData.studyTime);
    } else {
      console.log("学习时间小于视频时间，触发异常");
    }
  };
})();
