log('start');

const {
  from,
  fromEvent,
  merge,
  combineLatest,
  timer,
  BehaviorSubject,
  Subject,
} = rxjs;
const {
  tap,
  map,
  mapTo,
  exhaustMap,
  filter,
  debounceTime,
  delay,
} = rxjs.operators;

const BAR_CHART_DATE_IDS = generateDateIds();
let barChartIdsOffest = 0;
let barChartExtrasDOM;
let barChartActionsSubscription;
let barChartTypesSubscription;
let barChartPostsStats = {};

const barChartRefreshTrigger = new Subject(undefined);
const stateSubject = new BehaviorSubject(undefined);
const state$ = stateSubject.asObservable().pipe(
  filter((s) => !!s),
  map((s) =>
    urlIncludes('responses') ? s.user.totals.responses : s.user.totals.articles
  )
);

state$.subscribe((s) => {
  log('new state');
  updateTableSummary(s);
  updateTableRows(s);
  updateBarChart(s);
});

combineLatest(fromEvent(window, 'scroll'), state$)
  .pipe(debounceTime(500))
  .subscribe(([, s]) => updateTableRows(s));

combineLatest(fromEvent(window, 'resize'), state$)
  .pipe(tap(cleanBarChartExtras), debounceTime(500))
  .subscribe(([, s]) => updateBarChart(s));

// periodically check for new page
timer(0, 1000)
  .pipe(
    filter(isNewPage),
    tap(cleanBarChartExtras),
    exhaustMap(() => from(loadData()))
  )
  .subscribe((data) => {
    barChartIdsOffest = 0;
    stateSubject.next(data);

    // setup actions on current page
    if (barChartActionsSubscription) {
      barChartActionsSubscription.unsubscribe();
    }
    barChartActionsSubscription = combineLatest(
      merge(
        fromEvent(
          document.querySelector('.chartPage button:first-child'),
          'click'
        ).pipe(mapTo('left')),
        fromEvent(
          document.querySelector('.chartPage button:last-child'),
          'click'
        ).pipe(mapTo('right'))
      ),
      state$
    )
      .pipe(
        tap(([direction]) => {
          cleanBarChartExtras();
          direction === 'left' ? barChartIdsOffest++ : barChartIdsOffest--;
          barChartIdsOffest = barChartIdsOffest < 0 ? 0 : barChartIdsOffest;
        }),
        debounceTime(1500)
      )
      .subscribe(([, s]) => updateBarChart(s));

    if (barChartTypesSubscription) {
      barChartTypesSubscription.unsubscribe();
    }
    barChartTypesSubscription = combineLatest(
      merge(
        fromEvent(
          document.querySelector('li[data-action="switch-graph"]:nth-child(1)'),
          'click'
        ),
        fromEvent(
          document.querySelector('li[data-action="switch-graph"]:nth-child(2)'),
          'click'
        ),
        fromEvent(
          document.querySelector('li[data-action="switch-graph"]:nth-child(3)'),
          'click'
        ),
        barChartRefreshTrigger.asObservable()
      ),
      state$
    )
      .pipe(
        tap(() => cleanBarChartExtras()),
        delay(1000)
      )
      .subscribe(([, s]) => updateBarChart(s));
  });

function loadData() {
  log('load data');
  return new Promise((resolve) =>
    chrome.runtime.sendMessage({ type: 'GET_TOTALS' }, {}, (data) =>
      resolve(data)
    )
  );
}

function loadPostStats(postId) {
  log('load post stats');
  return new Promise((resolve) =>
    chrome.runtime.sendMessage({ type: 'GET_POST_STATS', postId }, {}, (data) =>
      resolve(data)
    )
  );
}

function loadPostStatsDetails(postId) {
  log('load post stats details');
  return new Promise((resolve) =>
    chrome.runtime.sendMessage({ type: 'GET_POST_STATS_DETAIL', postId }, {}, (data) =>
      resolve(data)
    )
  );
}

function loadTagDetails(tag) {
  return new Promise((resolve) =>
    chrome.runtime.sendMessage({ type: 'GET_TAG_DETAIL', postId:tag }, {}, (data) =>
      resolve(data)
    )
  );
}

function cleanBarChartExtras() {
  if (barChartExtrasDOM) {
    barChartExtrasDOM.innerHTML = '';
  }
  cleanBarChartPostBars();
}

function cleanBarChartPostBars() {
  document.querySelectorAll('.mes-post-bar').forEach((node) => node.remove());
}

function updateBarChart(data) {
  log('update barchart');
  const bars = document.querySelectorAll('.bargraph-bar:not(.mes-post-bar)');
  if (!bars.length || bars.length > 30) {
    setTimeout(() => updateBarChart(data), 500);
    return;
  }

  barChartExtrasDOM = document.querySelector('.mes-barchart-extras');
  if (!barChartExtrasDOM) {
    barChartExtrasDOM = document.createElement('div');
    barChartExtrasDOM.className = 'mes-barchart-extras';
    document.querySelector('.bargraph').appendChild(barChartExtrasDOM);
  }
  cleanBarChartExtras();

  const datePostMap = data.posts.reduce((result, post) => {
    const date = new Date(post.firstPublishedAt);
    const id = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    if (result[id]) {
      result[id].push(post);
    } else {
      result[id] = [post];
    }
    return result;
  }, {});

  const dateIds = getDateIds();
  const points = dateIds.map((id) => datePostMap[id]).reverse();
  const postStats =
    barChartPostsStats.id && barChartPostsStats[barChartPostsStats.id];
  const postBars = postStats && dateIds.map((id) => postStats[id]).reverse();

  Array.from(bars).forEach((node, index) => {
    const posts = points[index];
    if (posts) {
      const { width, bottom, left } = node.getBoundingClientRect();
      const sizeMultiplier = parseFloat(`1.${(posts.length - 1) * 3}`);
      const pWidth = (width / 3) * sizeMultiplier;
      const pWidthBorder = width / 8;
      const offset = (pWidth + pWidthBorder * 2) / 2;

      const point = document.createElement('div');
      point.style.left = left + width / 2 - offset + 'px';
      point.style.top = window.pageYOffset + bottom - offset + 'px';
      point.style.width = pWidth + 'px';
      point.style.height = pWidth + 'px';
      point.style.borderWidth = pWidthBorder + 'px';
      point.setAttribute(
        'data-tooltip',
        posts
          .map((p, i) => `${posts.length > 1 ? `${i + 1}. ` : ''}${p.title}`)
          .join(' ')
      );
      barChartExtrasDOM.appendChild(point);
    }

    if (postBars && postBars[index]) {
      const [value, type, ...rest] = node
        .getAttribute('data-tooltip')
        .split(' ');
      const nodeValue = parseInt(value.replace(',', ''), 10);
      const postValue = postBars[index][type];
      const ratio =
        nodeValue === 0 ? 0 : parseFloat((postValue / nodeValue).toFixed(2));
      const percentage = (ratio * 100).toFixed(0);
      const height =
        ratio == 0 && postValue > 0
          ? 5
          : (parseFloat(node.getAttribute('height')) * ratio).toFixed(1);
      const title = data.posts.find((p) => p.postId === barChartPostsStats.id)
        .title;
      const postBar = node.cloneNode();
      postBar.setAttribute('class', 'bargraph-bar mes-post-bar');
      postBar.setAttribute('height', height);
      postBar.setAttribute(
        'y',
        parseFloat(postBar.getAttribute('y')) +
          parseFloat(node.getAttribute('height')) -
          height
      );
      postBar.setAttribute(
        'data-tooltip',
        `${formatWholeNumber(postValue)} ${type} ${rest.join(
          ' '
        )} (${percentage}% of total daily ${type}) ${title}`
      );
      node.insertAdjacentElement('afterend', postBar);
    }
  });
}

function getTagName(str) {
  const arr = str.split("-");
  for (var i = 0; i < arr.length; i++) {
    arr[i] = arr[i].charAt(0).toUpperCase() + arr[i].slice(1);
  }
  return arr.join(" ");
}

function updateTableSummary(data) {
  const {
    items,
    views,
    syndicatedViews,
    reads,
    fans,
    claps,
    clapsPerFan,
    clapsPerViewsRatio,
    fansPerReadsRatio,
    ratio,
  } = data;
  log('update table summary');
  const table = document.querySelector('table');
  let tfoot = table.querySelector('tfoot');
  if (!tfoot) {
    tfoot = document.createElement('tfoot');
    table.appendChild(tfoot);
  }

  tfoot.innerHTML = `
      <tr>
        <td title="Items count" class="articles-count">${formatValue(
          items
        )}</td>
        <td title="${formatWholeNumber(views)}">
          ${formatValue(views)}
          ${
            syndicatedViews
              ? `<span class="syndicated-views">+${formatValue(
                  syndicatedViews
                )}</span>`
              : ''
          }
        </td>
        <td title="${formatWholeNumber(reads)}">${formatValue(reads)}</td>
        <td title="Weighted average">${ratio}%</td>
        <td title="${formatWholeNumber(fans)}">
            ${formatValue(fans)}
            <span class="claps" title="${formatWholeNumber(claps)}">
                ${formatValue(claps)}
                <span class="claps-per-fan" title="Claps per Fan">${clapsPerFan}</span>
                <span class="claps-per-views-ratio" title="Claps per View Ratio">${clapsPerViewsRatio}%</span>
                <span class="fans-per-reads-ratio" title="Fans per Reads Ratio">${fansPerReadsRatio}%</span>
            </span>
        </td>
        <td class="wordsCount" title="Words Count"></td>
      </tr>
    `;
}

function updateTableRows(data) {
  // const todayTotals = { views: 0, reads: 0, fans: 0, claps: 0 };
  const fansHeadCell = document.querySelector(
    'table thead th:nth-child(5) button'
  );
  fansHeadCell.innerHTML = `Fans <span class="claps">Claps</span>`;
  fansHeadCell.title = 'Fans, Claps and Claps per Fan';

  let tableHeadRow = document.querySelector('table thead tr');

  let wordsCountHeadCell = tableHeadRow.querySelector('.wordsCount');
  if (!wordsCountHeadCell) {
    wordsCountHeadCell = document.createElement('th');
    wordsCountHeadCell.className = 'sortableTable-header disabled wordsCount';
    wordsCountHeadCell.innerHTML = `<button class="button button--chromeless u-baseColor--buttonNormal js-views">Words Count</button>`;
    tableHeadRow.appendChild(wordsCountHeadCell);
  }
  const rows = document.querySelectorAll('table tbody tr');
  Array.from(rows)
    .filter((row) => row.getAttribute('data-action-value'))
    .forEach((row) => {
      const postId = row.getAttribute('data-action-value');
      const post = data.posts.find((post) => post.postId === postId);
      const fansCell = row.querySelector(
        'td:nth-child(5) .sortableTable-number'
      );
      const articleTitle = row.querySelector('.sortableTable-title');
      articleTitle.title = new Date(post.firstPublishedAt).toLocaleDateString();

      let claps = fansCell.querySelector('.claps');
      if (!claps) {
        claps = document.createElement('span');
        claps.className = 'claps';
        fansCell.appendChild(claps);
      }
      if (post) {
        const clapsPerFan =
          post.upvotes === 0 ? 0 : (post.claps / post.upvotes).toFixed(2);
        const clapsPerViewsRatio =
          post.upvotes === 0 ? 0 : ((post.claps / post.views) * 100).toFixed(1);
        const fansPerReadsRatio =
          (post.upvotes === 0 || post.reads === 0)
            ? 0
            : ((post.upvotes / post.reads) * 100).toFixed(1);
        claps.innerHTML = `
          <span title="${formatWholeNumber(post.claps)}">${formatValue(
          post.claps
        )}</span>
          <span class="claps-per-fan" title="Claps per Fan">${clapsPerFan}</span>
          <span class="claps-per-views-ratio" title="Claps per Views Ratio">${clapsPerViewsRatio}%</span>
          <span class="fans-per-reads-ratio" title="Fans Per Reads Ratio">${fansPerReadsRatio}%</span>
        `;
      }

      const postTitleCell = row.querySelector('td:first-child');
      const postTitleCellActions = postTitleCell.querySelector(
        '.sortableTable-text'
      );

      if (postTitleCellActions.children.length <= 4) {
        postTitleCellActions.innerHTML += '<br />'
        postTitleCell.addEventListener('click', () => {
          scrollToBarChart();
          cleanBarChartExtras();
          barChartPostsStats.id = undefined;
          Promise.resolve()
            .then(() => barChartPostsStats[postId] || loadPostStats(postId))
            .then((postStats) => {
              barChartPostsStats[postId] = postStats;
              const dateId = Object.keys(postStats)[0];
              let dateIds = getDateIds();
              while (dateId > dateIds[0]) {
                barChartIdsOffest--;
                dateIds = getDateIds();
              }
              barChartRefreshTrigger.next();
            });
        });

        chrome.storage.local.get([post.postId]).then(data => {
          if(data[post.postId] === undefined){
            loadPostStatsDetails(post.postId).then(data => {
              const showTagInActionTable = document.createElement('table');
              const showTagInActionRow = document.createElement('tr');
              const showTagInActionRow2 = document.createElement('tr');
              data[post.postId].tags.map((tag, index) => {
                const showTagInActionCell = document.createElement('td');
                const showTagInActionCell2 = document.createElement('td');
                const showTagInAction = document.createElement('a');
                chrome.storage.local.get([tag]).then(data => {
                  if(data[tag] === undefined || !data[tag].hasOwnProperty("lastUpdate") || (Date.now() - data[tag].lastUpdate) > 604800000){
                    loadTagDetails(tag).then(data => {
                      data.tag = tag;
                      chrome.storage.local.set({ [tag]: data }).then(() => {
                        const followersToStories = Math.round((Number(data[tag].followers)/Number(data[tag].stories))*100)/100;
                        const followersToWriters = Math.round((Number(data[tag].followers)/Number(data[tag].writers))*100)/100;
                        const storiesToWriters = Math.round((Number(data[tag].stories)/Number(data[tag].writers))*100)/100;
                        function followersCell(followers) {
                          let final_class = "";
                          let title = "";
                          if (followersToStories >=5) {
                            final_class = "mes-tag excellent";
                            title = "Excellent 5x or more followers than stories";
                          } else if (followersToWriters > 50) {
                            final_class = "mes-tag excellent";
                            title="Excellent followers to writers above 50. Here people really want more content.";
                          } else if(followersToWriters >= 20){
                            final_class = "mes-tag good";
                            title="Good followers to writers above 20";
                          } else if(followersToWriters < 1){
                            final_class = "mes-tag bad"
                            title="Bad followers to writers bellow 1";
                          } else if (followersToStories >=4) {
                            final_class = "mes-tag amazing";
                            title = "Amazing followers to stories higher than 4x";
                          } else if(followersToStories>=2.5){
                            final_class = "mes-tag good";
                            title = "Good followers to stories higher than 2.5x";
                          } else if(followersToStories<0.1) {
                            final_class = "mes-tag bad"
                            title = "Bad followers to stories less than 0.1x";
                          } else if(storiesToWriters>50){
                            final_class = "mes-tag bad";
                            title="Here is propably one owner of this tag, so it may be hard to beat him.";
                          } else if(followers<50){
                            final_class = "mes-tag bad";
                            title="Followers bellow 50, find better tag";
                          } else {
                            final_class = "mes-tag";
                          }

                          return [final_class, title]
                        }

                        [className, title] = followersCell(data[tag].followers)
                        showTagInAction.textContent = getTagName(tag);
                        showTagInAction.href = `https://medium.com/tag/${tag}`;
                        showTagInAction.target= "_blank";
                        showTagInAction.className = className;
                        showTagInAction.title = title;
                        showTagInActionCell.appendChild(showTagInAction);
                        showTagInActionRow.appendChild(showTagInActionCell);

                        const  dollar = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 48 48"><title>currency-dollar-1</title><g><path d="M38,31.943c0-7.013-6.468-9.372-12-11.144V8.487a27.133,27.133,0,0,1,7.126,1.3l2.337.876L37.219,5.98,34.878,5.1A31.706,31.706,0,0,0,26,3.481V0H22V3.584c-6.845.738-11,4.561-11,10.359,0,6.594,5.718,9.072,11,10.819v12.59a33.358,33.358,0,0,1-8.651-1.761L11,34.742l-1.7,4.7,2.351.849A38.2,38.2,0,0,0,22,42.364V48h4V42.388C36.788,41.737,38,34.937,38,31.943Zm-22-18c0-3.66,3.114-4.935,6-5.334V19.466C17.938,17.983,16,16.617,16,13.943ZM26,37.384V26.068c4.746,1.628,7,2.991,7,5.875C33,33.335,33,36.886,26,37.384Z" fill="green"></path></g></svg>';
                        const  person = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 48 48"><title>male</title><g><path fill-rule="evenodd" clip-rule="evenodd" fill="#5A7A84" d="M24,1c-3.3077145,0-6,2.6914291-6,6s2.6922855,6,6,6 c3.3077087,0,6-2.6914291,6-6S27.3077087,1,24,1"></path> <path fill-rule="evenodd" clip-rule="evenodd" fill="#335262" d="M20.0006599,15C16.6865864,15,14,17.6780396,14,21.0033302V31 c0,0.4589996,0.3120003,0.8590012,0.7580004,0.9700012l3.3049994,0.8259964l0.941,13.2870026 C19.0470009,46.6020012,19.4790001,47,20,47h8c0.5209999,0,0.9529991-0.3979988,0.9960003-0.9169998l0.941-13.2870026 l3.3050003-0.8259964C33.6879997,31.8590012,34,31.4589996,34,31v-9.9966698C34,17.6877804,31.3234596,15,27.9993401,15H20.0006599z "></path></g></svg>';
                        if(data[tag].followers>3000000){
                          showTagInActionCell2.innerHTML += person;
                          showTagInActionCell2.innerHTML += person;
                          showTagInActionCell2.innerHTML += person;
                          showTagInActionCell2.innerHTML += person;
                          showTagInActionCell2.innerHTML += person;
                        } else if(data[tag].followers>2000000){
                          showTagInActionCell2.innerHTML += person;
                          showTagInActionCell2.innerHTML += person;
                          showTagInActionCell2.innerHTML += person;
                          showTagInActionCell2.innerHTML += person;
                        }else if(data[tag].followers>1000000){
                          showTagInActionCell2.innerHTML += person;
                          showTagInActionCell2.innerHTML += person;
                          showTagInActionCell2.innerHTML += person;
                        } else if(data[tag].followers>500000){
                          showTagInActionCell2.innerHTML += person;
                          showTagInActionCell2.innerHTML += person;
                        } else if(data[tag].followers>100000){
                          showTagInActionCell2.innerHTML += person;
                        }


                        if(data[tag].followers<250000){
                          showTagInActionCell2.innerHTML += dollar;
                        }if(data[tag].followers<20000){
                          showTagInActionCell2.innerHTML += dollar;
                          showTagInActionCell2.innerHTML += dollar;
                        } else if(data[tag].followers<10000){
                          showTagInActionCell2.innerHTML += dollar;
                          showTagInActionCell2.innerHTML += dollar;
                          showTagInActionCell2.innerHTML += dollar;
                        } else if(data[tag].followers<2500){
                          showTagInActionCell2.innerHTML += dollar;
                          showTagInActionCell2.innerHTML += dollar;
                          showTagInActionCell2.innerHTML += dollar;
                          showTagInActionCell2.innerHTML += dollar;
                        }else if(data[tag].followers<250){
                          showTagInActionCell2.innerHTML += dollar;
                          showTagInActionCell2.innerHTML += dollar;
                          showTagInActionCell2.innerHTML += dollar;
                          showTagInActionCell2.innerHTML += dollar;
                          showTagInActionCell2.innerHTML += dollar;
                        }
                        showTagInActionRow2.appendChild(showTagInActionCell2);
                        return;
                      });
                    })
                  }  else {
                    const followersToStories = Math.round((Number(data[tag].followers)/Number(data[tag].stories))*100)/100;
                    const followersToWriters = Math.round((Number(data[tag].followers)/Number(data[tag].writers))*100)/100;
                    const storiesToWriters = Math.round((Number(data[tag].stories)/Number(data[tag].writers))*100)/100;
                    function followersCell(followers) {
                      let final_class = "";
                      let title = "";
                      if (followersToStories >=5) {
                        final_class = "mes-tag excellent";
                        title = "Excellent 5x or more followers than stories";
                      } else if (followersToWriters > 50) {
                        final_class = "mes-tag excellent";
                        title="Excellent followers to writers above 50. Here people really want more content.";
                      } else if(followersToWriters >= 20){
                        final_class = "mes-tag good";
                        title="Good followers to writers above 20";
                      } else if(followersToWriters < 1){
                        final_class = "mes-tag bad"
                        title="Bad followers to writers bellow 1";
                      } else if (followersToStories >=4) {
                        final_class = "mes-tag amazing";
                        title = "Amazing followers to stories higher than 4x";
                      } else if(followersToStories>=2.5){
                        final_class = "mes-tag good";
                        title = "Good followers to stories higher than 2.5x";
                      } else if(followersToStories<0.1) {
                        final_class = "mes-tag bad"
                        title = "Bad followers to stories less than 0.1x";
                      } else if(storiesToWriters>50){
                        final_class = "mes-tag bad";
                        title="Here is propably one owner of this tag, so it may be hard to beat him.";
                      } else if(followers<50){
                        final_class = "mes-tag bad";
                        title="Followers bellow 50, find better tag";
                      } else {
                        final_class = "mes-tag";
                      }

                      return [final_class, title]
                    }

                    [className, title] = followersCell(data[tag].followers)
                    showTagInAction.textContent = getTagName(tag);
                    showTagInAction.href = `https://medium.com/tag/${tag}`;
                    showTagInAction.target= "_blank";
                    showTagInAction.className = className;
                    showTagInAction.title = title;
                    showTagInActionCell.appendChild(showTagInAction);
                    showTagInActionRow.appendChild(showTagInActionCell);

                    const  dollar = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 48 48"><title>currency-dollar-1</title><g><path d="M38,31.943c0-7.013-6.468-9.372-12-11.144V8.487a27.133,27.133,0,0,1,7.126,1.3l2.337.876L37.219,5.98,34.878,5.1A31.706,31.706,0,0,0,26,3.481V0H22V3.584c-6.845.738-11,4.561-11,10.359,0,6.594,5.718,9.072,11,10.819v12.59a33.358,33.358,0,0,1-8.651-1.761L11,34.742l-1.7,4.7,2.351.849A38.2,38.2,0,0,0,22,42.364V48h4V42.388C36.788,41.737,38,34.937,38,31.943Zm-22-18c0-3.66,3.114-4.935,6-5.334V19.466C17.938,17.983,16,16.617,16,13.943ZM26,37.384V26.068c4.746,1.628,7,2.991,7,5.875C33,33.335,33,36.886,26,37.384Z" fill="green"></path></g></svg>';
                    const  person = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 48 48"><title>male</title><g><path fill-rule="evenodd" clip-rule="evenodd" fill="#5A7A84" d="M24,1c-3.3077145,0-6,2.6914291-6,6s2.6922855,6,6,6 c3.3077087,0,6-2.6914291,6-6S27.3077087,1,24,1"></path> <path fill-rule="evenodd" clip-rule="evenodd" fill="#335262" d="M20.0006599,15C16.6865864,15,14,17.6780396,14,21.0033302V31 c0,0.4589996,0.3120003,0.8590012,0.7580004,0.9700012l3.3049994,0.8259964l0.941,13.2870026 C19.0470009,46.6020012,19.4790001,47,20,47h8c0.5209999,0,0.9529991-0.3979988,0.9960003-0.9169998l0.941-13.2870026 l3.3050003-0.8259964C33.6879997,31.8590012,34,31.4589996,34,31v-9.9966698C34,17.6877804,31.3234596,15,27.9993401,15H20.0006599z "></path></g></svg>';
                    if(data[tag].followers>3000000){
                      showTagInActionCell2.innerHTML += person;
                      showTagInActionCell2.innerHTML += person;
                      showTagInActionCell2.innerHTML += person;
                      showTagInActionCell2.innerHTML += person;
                      showTagInActionCell2.innerHTML += person;
                    } else if(data[tag].followers>2000000){
                      showTagInActionCell2.innerHTML += person;
                      showTagInActionCell2.innerHTML += person;
                      showTagInActionCell2.innerHTML += person;
                      showTagInActionCell2.innerHTML += person;
                    }else if(data[tag].followers>1000000){
                      showTagInActionCell2.innerHTML += person;
                      showTagInActionCell2.innerHTML += person;
                      showTagInActionCell2.innerHTML += person;
                    } else if(data[tag].followers>500000){
                      showTagInActionCell2.innerHTML += person;
                      showTagInActionCell2.innerHTML += person;
                    } else if(data[tag].followers>100000){
                      showTagInActionCell2.innerHTML += person;
                    }


                    if(data[tag].followers<250000){
                      showTagInActionCell2.innerHTML += dollar;
                    }if(data[tag].followers<20000){
                      showTagInActionCell2.innerHTML += dollar;
                      showTagInActionCell2.innerHTML += dollar;
                    } else if(data[tag].followers<10000){
                      showTagInActionCell2.innerHTML += dollar;
                      showTagInActionCell2.innerHTML += dollar;
                      showTagInActionCell2.innerHTML += dollar;
                    } else if(data[tag].followers<2500){
                      showTagInActionCell2.innerHTML += dollar;
                      showTagInActionCell2.innerHTML += dollar;
                      showTagInActionCell2.innerHTML += dollar;
                      showTagInActionCell2.innerHTML += dollar;
                    }else if(data[tag].followers<250){
                      showTagInActionCell2.innerHTML += dollar;
                      showTagInActionCell2.innerHTML += dollar;
                      showTagInActionCell2.innerHTML += dollar;
                      showTagInActionCell2.innerHTML += dollar;
                      showTagInActionCell2.innerHTML += dollar;
                    }
                    showTagInActionRow2.appendChild(showTagInActionCell2);
                    return;
                  }
                });

                showTagInActionTable.appendChild(showTagInActionRow)
                showTagInActionTable.appendChild(showTagInActionRow2)
                postTitleCellActions.appendChild(showTagInActionTable)
              })
              let wordsCountCell = row.querySelector('.wordsCount');
              if (!wordsCountCell) {
                wordsCountCell = document.createElement('td');
                wordsCountCell.className = 'wordsCount';
                wordsCountCell.textContent = Math.ceil(Number(data.readingTime) * 280);
                row.appendChild(wordsCountCell);
              }

            })
            chrome.storage.local.set({ [post.postId]: { ...post,...data } });
          } else {

            const postTitleCellActions = postTitleCell.querySelector(
              '.sortableTable-text'
            );
            const showTagInActionTable = document.createElement('table');
            const showTagInActionRow = document.createElement('tr');
            const showTagInActionRow2 = document.createElement('tr');
            data[post.postId].tags.map((tag, index) => {
              const showTagInActionCell = document.createElement('td');
              const showTagInActionCell2 = document.createElement('td');
              const showTagInAction = document.createElement('a');
              chrome.storage.local.get([tag]).then(data => {
                if(data[tag] === undefined || !data[tag].hasOwnProperty("lastUpdate") || (Date.now() - data[tag].lastUpdate) > 604800000){
                  loadTagDetails(tag).then(data => {
                    data.tag = tag;
                    chrome.storage.local.set({ [tag]: data }).then(() => {

                      if(index>0){
                        showTagInActionCell.innerHTML += '<td><span class="middotDivider"></span></td>';
                      }
                      showTagInAction.textContent = getTagName(tag);
                      showTagInAction.href = `https://medium.com/tag/${tag}`;
                      showTagInAction.target= "_blank";
                      showTagInAction.className = 'mes-tag';
                      showTagInActionCell.appendChild(showTagInAction);
                      showTagInActionRow.appendChild(showTagInActionCell);
                      return;
                    });
                  })
                }  else {
                  const followersToStories = Math.round((Number(data[tag].followers)/Number(data[tag].stories))*100)/100;
                  const followersToWriters = Math.round((Number(data[tag].followers)/Number(data[tag].writers))*100)/100;
                  const storiesToWriters = Math.round((Number(data[tag].stories)/Number(data[tag].writers))*100)/100;
                  function followersCell(followers) {
                    let final_class = "";
                    let title = "";
                    if (followersToStories >=5) {
                      final_class = "mes-tag excellent";
                      title = "Excellent 5x or more followers than stories";
                    } else if (followersToWriters > 50) {
                      final_class = "mes-tag excellent";
                      title="Excellent followers to writers above 50. Here people really want more content.";
                    } else if(followersToWriters >= 20){
                      final_class = "mes-tag good";
                      title="Good followers to writers above 20";
                    } else if(followersToWriters < 1){
                      final_class = "mes-tag bad"
                      title="Bad followers to writers bellow 1";
                    } else if (followersToStories >=4) {
                      final_class = "mes-tag amazing";
                      title = "Amazing followers to stories higher than 4x";
                    } else if(followersToStories>=2.5){
                      final_class = "mes-tag good";
                      title = "Good followers to stories higher than 2.5x";
                    } else if(followersToStories<0.1) {
                      final_class = "mes-tag bad"
                      title = "Bad followers to stories less than 0.1x";
                    } else if(storiesToWriters>50){
                      final_class = "mes-tag bad";
                      title="Here is propably one owner of this tag, so it may be hard to beat him.";
                    } else if(followers<50){
                      final_class = "mes-tag bad";
                      title="Followers bellow 50, find better tag";
                    } else {
                      final_class = "mes-tag";
                    }

                    return [final_class, title]
                  }

                  // if(index>0){
                  //   showTagInActionRow.innerHTML += '<td><span class="middotDivider"></span></td>';
                  // }
                  [className, title] = followersCell(data[tag].followers)
                  showTagInAction.textContent = getTagName(tag);
                  showTagInAction.href = `https://medium.com/tag/${tag}`;
                  showTagInAction.target= "_blank";
                  showTagInAction.className = className;
                  showTagInAction.title = title;
                  showTagInActionCell.appendChild(showTagInAction);
                  showTagInActionRow.appendChild(showTagInActionCell);

                  // row 2
                  // if(index>0){
                  //   showTagInActionRow2.innerHTML += '<td><span class="middotDivider"></span></td>';
                  // }
                  const  dollar = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 48 48"><title>currency-dollar-1</title><g><path d="M38,31.943c0-7.013-6.468-9.372-12-11.144V8.487a27.133,27.133,0,0,1,7.126,1.3l2.337.876L37.219,5.98,34.878,5.1A31.706,31.706,0,0,0,26,3.481V0H22V3.584c-6.845.738-11,4.561-11,10.359,0,6.594,5.718,9.072,11,10.819v12.59a33.358,33.358,0,0,1-8.651-1.761L11,34.742l-1.7,4.7,2.351.849A38.2,38.2,0,0,0,22,42.364V48h4V42.388C36.788,41.737,38,34.937,38,31.943Zm-22-18c0-3.66,3.114-4.935,6-5.334V19.466C17.938,17.983,16,16.617,16,13.943ZM26,37.384V26.068c4.746,1.628,7,2.991,7,5.875C33,33.335,33,36.886,26,37.384Z" fill="green"></path></g></svg>';
                  const  person = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 48 48"><title>male</title><g><path fill-rule="evenodd" clip-rule="evenodd" fill="#5A7A84" d="M24,1c-3.3077145,0-6,2.6914291-6,6s2.6922855,6,6,6 c3.3077087,0,6-2.6914291,6-6S27.3077087,1,24,1"></path> <path fill-rule="evenodd" clip-rule="evenodd" fill="#335262" d="M20.0006599,15C16.6865864,15,14,17.6780396,14,21.0033302V31 c0,0.4589996,0.3120003,0.8590012,0.7580004,0.9700012l3.3049994,0.8259964l0.941,13.2870026 C19.0470009,46.6020012,19.4790001,47,20,47h8c0.5209999,0,0.9529991-0.3979988,0.9960003-0.9169998l0.941-13.2870026 l3.3050003-0.8259964C33.6879997,31.8590012,34,31.4589996,34,31v-9.9966698C34,17.6877804,31.3234596,15,27.9993401,15H20.0006599z "></path></g></svg>';
                  if(data[tag].followers>3000000){
                    showTagInActionCell2.innerHTML += person;
                    showTagInActionCell2.innerHTML += person;
                    showTagInActionCell2.innerHTML += person;
                    showTagInActionCell2.innerHTML += person;
                    showTagInActionCell2.innerHTML += person;
                  } else if(data[tag].followers>2000000){
                    showTagInActionCell2.innerHTML += person;
                    showTagInActionCell2.innerHTML += person;
                    showTagInActionCell2.innerHTML += person;
                    showTagInActionCell2.innerHTML += person;
                  }else if(data[tag].followers>1000000){
                    showTagInActionCell2.innerHTML += person;
                    showTagInActionCell2.innerHTML += person;
                    showTagInActionCell2.innerHTML += person;
                  } else if(data[tag].followers>500000){
                    showTagInActionCell2.innerHTML += person;
                    showTagInActionCell2.innerHTML += person;
                  } else if(data[tag].followers>100000){
                    showTagInActionCell2.innerHTML += person;
                  }


                  if(data[tag].followers<250000){
                    showTagInActionCell2.innerHTML += dollar;
                  }if(data[tag].followers<20000){
                    showTagInActionCell2.innerHTML += dollar;
                    showTagInActionCell2.innerHTML += dollar;
                  } else if(data[tag].followers<10000){
                    showTagInActionCell2.innerHTML += dollar;
                    showTagInActionCell2.innerHTML += dollar;
                    showTagInActionCell2.innerHTML += dollar;
                  } else if(data[tag].followers<2500){
                    showTagInActionCell2.innerHTML += dollar;
                    showTagInActionCell2.innerHTML += dollar;
                    showTagInActionCell2.innerHTML += dollar;
                    showTagInActionCell2.innerHTML += dollar;
                  }else if(data[tag].followers<250){
                    showTagInActionCell2.innerHTML += dollar;
                    showTagInActionCell2.innerHTML += dollar;
                    showTagInActionCell2.innerHTML += dollar;
                    showTagInActionCell2.innerHTML += dollar;
                    showTagInActionCell2.innerHTML += dollar;
                  }
                  showTagInActionRow2.appendChild(showTagInActionCell2);
                  return;
                }
              });

              showTagInActionTable.appendChild(showTagInActionRow)
              showTagInActionTable.appendChild(showTagInActionRow2)
              postTitleCellActions.appendChild(showTagInActionTable)
            })

            let wordsCountCell = row.querySelector('.wordsCount');
            if (!wordsCountCell) {
              wordsCountCell = document.createElement('td');
              wordsCountCell.className = 'wordsCount';
              wordsCountCell.textContent = Math.ceil(Number(data[post.postId].readingTime) * 280);
              row.appendChild(wordsCountCell);
            }
          }
        });
      }
    });
}

function scrollToBarChart() {
  document
    .querySelector('.chartTabs')
    .scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function isNewPage() {
  return urlIncludes('stats') && !document.querySelector('table tfoot');
}

function urlIncludes(text) {
  return window.location.pathname.includes(text);
}

function formatValue(number = 0) {
  return number >= 1000000000
    ? (Math.floor(number / 100000000) / 10).toFixed(1) + 'B'
    : number >= 1000000
    ? (Math.floor(number / 100000) / 10).toFixed(1) + 'M'
    : number >= 1000
    ? (Math.floor(number / 100) / 10).toFixed(1) + 'K'
    : number.toFixed(0);
}

function formatWholeNumber(number = 0) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function getDateIds() {
  const offset = barChartIdsOffest === 0 ? 0 : barChartIdsOffest * 30;
  return BAR_CHART_DATE_IDS.slice(offset, offset + 30);
}

function generateDateIds() {
  const endDate = new Date();
  let startDate = new Date(
    endDate.getFullYear() - 10,
    endDate.getMonth(),
    endDate.getDate()
  );
  let start = startDate.getTime();
  const end = endDate.getTime();
  const oneDay = 24 * 3600 * 1000;
  const ids = [];
  for (; start < end; start += oneDay) {
    startDate = new Date(start);
    ids.push(
      `${startDate.getFullYear()}-${startDate.getMonth()}-${startDate.getDate()}`
    );
  }
  return ids.reverse();
}

function log(...args) {
  console.log('Medium Enhanced Stats & Tags [stats] -', ...args);
}
