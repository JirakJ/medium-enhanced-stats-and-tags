logTag('start');

function waitForElementToDisplay(selector, callback, checkFrequencyInMs, timeoutInMs) {
  var startTimeInMs = Date.now();
  (function loopSearch() {
    const data = document.querySelector(selector)
    if (data != null) {
      callback(data);
      return;
    }
    else {
      setTimeout(function () {
        if (timeoutInMs && Date.now() - startTimeInMs > timeoutInMs)
          return;
        loopSearch();
      }, checkFrequencyInMs);
    }
  })();
}
function renderTagStats(element, results) {
  const tagData = results
  const container$ = element.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement

  const tagStatsContainer$ = document.querySelector(`.mes-tag-stats-extras`);
  if(tagStatsContainer$){
    tagStatsContainer$.remove()
  }

  if (container$) {
    container$.classList.add('mes-tag-stats-extras-container');
    const {
      lastUpdate,
      followers,
      writers,
      stories,
      relatedTags
    } = tagData;
    const tagStatsExtrasDOM = document.createElement('div');

    const followersToStories = Math.round((Number(followers)/Number(stories))*100)/100;
    function followersToStoriesCell(followersToStories) {
      let final_class = "";
      let title = "";
      if (followersToStories >=5) {
        final_class = "value excellent";
        title = "Excellent followers to stories higher than 5x";
      } else if(followersToStories>=2.5){
        final_class = "value good";
        title = "Good followers to stories higher than 2.5x";
      } else if(followersToStories>=1){
        final_class = "value";
      } else {
        final_class = "value bad"
        title = "Bad followers to stories less than 1x";
      }
      return `<td class="${final_class}" title="${title}">${followersToStories}</td>`
    }

    function followersToWritersCell(followersToWriters) {
      let final_class = "";
      let title = "";
      if (followersToWriters > 50) {
        final_class = "value excellent";
        title="Excellent followers to writers above 50";
      } else if(followersToWriters >= 20){
        final_class = "value good";
        title="Good followers to writers above 20";
      } else if(followersToWriters < 1){
        final_class = "value bad"
        title="Bad followers to writers bellow 1";
      } else {
        final_class = "value"
      }
      return `<td class="${final_class}" title="${title}">${followersToWriters}</td>`
    }

    function followersCell(followers) {
      let final_class = "";
      let title = "";
      if(followers<50){
        final_class = "value bad";
        title="Followers bellow 50";
      } else if (followersToStories >=5) {
        final_class = "value excellent";
        title = "Excellent 5x or more followers than stories";
      } else {
        final_class = "value";
      }
      return `<td class="${final_class}" title="${title}">${followers}</td>`
    }

    const followersToWriters = Math.round((Number(followers)/Number(writers))*100)/100;
    const storiesToWriters = Math.round((Number(stories)/Number(writers))*100)/100;
    tagStatsExtrasDOM.className = 'mes-tag-stats-extras';
    tagStatsExtrasDOM.innerHTML = `
        <table class='spacer'>
            <tr class="entry">
              <td class="title">Followers</td>
              ${followersCell(followers)}
              <td class="title">Writers</td>
              <td class="value">${writers}</td>
              <td class="title">Stories</td>
              <td class="value">${stories}</td>
            </tr>
            <tr class="entry">
              <td class="title">Followers/Stories</td>
              ${followersToStoriesCell(followersToStories)}
              <td class="title">Followers/Writers</td>
              ${followersToWritersCell(followersToWriters)}
              <td class="title">Stories/Writers</td>
              <td class="value">${storiesToWriters}</td>
            </tr>
        </table>
        <hr>
      `;
    container$.parentElement.appendChild(tagStatsExtrasDOM);
  }
}
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    // listen for messages sent from background.js
    if (request.message === 'url_changed') {
      function loadTagDetails(tag) {
        return new Promise((resolve) =>
          chrome.runtime.sendMessage({ type: 'GET_TAG_DETAIL', postId:tag }, {}, (data) =>
            resolve(data)
          )
        );
      }

      try {
        const currentUrl = window.location.toString();
        const tag = currentUrl.substring(currentUrl.lastIndexOf('/') + 1);
        waitForElementToDisplay(`a[href^="/tag/${tag}"]`,function(element){
          chrome.storage.local.get([tag]).then(data => {
            if(data[tag] === undefined || !data[tag].hasOwnProperty("lastUpdate") || (Date.now() - data[tag].lastUpdate) > 21600000){
              loadTagDetails(tag).then(data => {
                data.tag = tag;
                chrome.storage.local.set({ [tag]: data }).then(() => {
                  if(request.rerender){
                    renderTagStats(element, data)
                  }
                  return;
                });
              })
            }  else {
              if(request.rerender){
                renderTagStats(element, data[tag])
              }
              return;
            }
          });

        },1000,9000);
      } catch (error) {
        console.error('Medium Enhanced Stats & Tags [tag]', error);
      }
    }

  });

function logTag(...args) {
  console.log('Medium Enhanced Stats & Tags [tags] -', ...args);
}
