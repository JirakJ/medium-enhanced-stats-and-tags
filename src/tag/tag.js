logTag('start');

logTag("Current url",window.location.toString())

function loadTagDetails(tag) {
  log('load tag details for ', tag);
  return new Promise((resolve) =>
    chrome.runtime.sendMessage({ type: 'GET_TAG_DETAIL', postId:tag }, {}, (data) =>
      resolve(data)
    )
  );
}

Array.from(document.querySelectorAll('[aria-controls="searchResults"]') ?? [])
  .forEach((s) => {
    try {
      const currentUrl = window.location.toString();
      const tag = currentUrl.substring(currentUrl.lastIndexOf('/') + 1);
      logTag("Searched tag",tag, currentUrl);
      chrome.storage.sync.get([tag]).then(data => {
        if(data[tag] === undefined){
          loadTagDetails(tag).then(data => {
            logTag("loadTagDetails", data)
            data.tag = tag;
            chrome.storage.sync.set({ [tag]: data }).then(() => {
              logTag(`Data for tag ${tag} has been saved`,data)
              rendertagStats(data)
            });
          })
        } else {
          logTag("Load stored tag data",data)
          rendertagStats(data[tag]);
        }
      });

      logTag('finished');
    } catch (error) {
      console.error('Medium Enhanced Stats & Tags [tag]', error);
    }
  });

function rendertagStats(results) {
  // const container$ = document.querySelector('[aria-label="Homepage"]');
  const container$ = document.querySelector(`a[href^="/tag/${results.tag}"]`).parentElement.parentElement.parentElement.parentElement.parentElement.parentElement;
  const tagStatsContainer$ = document.querySelector(`.mes-tag-stats-extras`);
  if(tagStatsContainer$){
    tagStatsContainer$.remove()
  }

  if (container$) {
    container$.classList.add('mes-tag-stats-extras-container');
    const {
      followers,
      writers,
      stories,
      relatedTags
    } = results;
    const tagStatsExtrasDOM = document.createElement('div');

    const followersToStories = Math.round((Number(followers)/Number(stories))*100)/100;
    function followersToStoriesCell(followersToStories) {
      let final_class = ""
      if (followersToStories >=5) {
        final_class = "value excellent"
      } else if(followersToStories>=2.5){
        final_class = "value good"
      } else {
        final_class = "value bad"
      }
      return `<td class="${final_class}">${followersToStories}</td>`
    }

    function followersToWritersCell(followersToWriters) {
      let final_class = ""
      if (followersToWriters >50) {
        final_class = "value excellent"
      } else if(followersToWriters>=20){
        final_class = "value good"
      } else if(followersToWriters<1){
        final_class = "value bad"
      } else {
        final_class = "value"
      }
      return `<td class="${final_class}">${followersToWriters}</td>`
    }

    function followersCell(followers) {
      let final_class = ""
      if(followers<50){
        final_class = "value bad"
      } else if (followersToStories >=5) {
        final_class = "value excellent"
      } else {
        final_class = "value"
      }
      return `<td class="${final_class}">${followers}</td>`
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
    if (request.message === 'hello!') {
      if(!request.url.includes("?") || window.location.toString().includes("tag")){
        logTag("Current url",request.url)

        function loadTagDetails(tag) {
          log('load tag details for ', tag);
          return new Promise((resolve) =>
            chrome.runtime.sendMessage({ type: 'GET_TAG_DETAIL', postId:tag }, {}, (data) =>
              resolve(data)
            )
          );
        }

        Array.from(document.querySelectorAll('[aria-controls="searchResults"]') ?? [])
          .forEach((s) => {
            try {
              const currentUrl = window.location.toString();
              const tag = currentUrl.substring(currentUrl.lastIndexOf('/') + 1);
              logTag("Searched tag",tag, currentUrl);
              chrome.storage.sync.get([tag]).then(data => {
                if(data[tag] === undefined){
                  loadTagDetails(tag).then(data => {
                    logTag("loadTagDetails", data)
                    data.tag = tag;
                    chrome.storage.sync.set({ [tag]: data }).then(() => {
                      logTag(`Data for tag ${tag} has been saved`,data)
                      rendertagStats(data)
                    });
                  })
                } else {
                  logTag("Load stored tag data",data)
                  rendertagStats(data[tag]);
                }
              });

              logTag('finished');
            } catch (error) {
              console.error('Medium Enhanced Stats & Tags [tag]', error);
            }
          });

        function rendertagStats(results) {
          // const container$ = document.querySelector('[aria-label="Homepage"]');
          const container$ = document.querySelector(`a[href^="/tag/${results.tag}"]`).parentElement.parentElement.parentElement.parentElement.parentElement.parentElement;
          const tagStatsContainer$ = document.querySelector(`.mes-tag-stats-extras`);
          if(tagStatsContainer$){
            tagStatsContainer$.remove()
          }

          if (container$) {
            container$.classList.add('mes-tag-stats-extras-container');
            const {
              followers,
              writers,
              stories,
              relatedTags
            } = results;
            const tagStatsExtrasDOM = document.createElement('div');

            const followersToStories = Math.round((Number(followers)/Number(stories))*100)/100;
            function followersToStoriesCell(followersToStories) {
              let final_class = ""
              if (followersToStories >=5) {
                final_class = "value excellent"
              } else if(followersToStories>=2.5){
                final_class = "value good"
              } else {
                final_class = "value bad"
              }
              return `<td class="${final_class}">${followersToStories}</td>`
            }

            function followersToWritersCell(followersToWriters) {
              let final_class = ""
              if (followersToWriters >50) {
                final_class = "value excellent"
              } else if(followersToWriters>=20){
                final_class = "value good"
              } else if(followersToWriters<1){
                final_class = "value bad"
              } else {
                final_class = "value"
              }
              return `<td class="${final_class}">${followersToWriters}</td>`
            }

            function followersCell(followers) {
              let final_class = ""
              if(followers<50){
                final_class = "value bad"
              } else if (followersToStories >=5) {
                final_class = "value excellent"
              } else {
                final_class = "value"
              }
              return `<td class="${final_class}">${followers}</td>`
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
      }
    }

  });

function logTag(...args) {
  console.log('Medium Enhanced Stats & Tags [tag] -', ...args);
}
