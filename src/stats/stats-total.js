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

const enable_icons = false;

const  dollar = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 48 48"><g><path d="M38,31.943c0-7.013-6.468-9.372-12-11.144V8.487a27.133,27.133,0,0,1,7.126,1.3l2.337.876L37.219,5.98,34.878,5.1A31.706,31.706,0,0,0,26,3.481V0H22V3.584c-6.845.738-11,4.561-11,10.359,0,6.594,5.718,9.072,11,10.819v12.59a33.358,33.358,0,0,1-8.651-1.761L11,34.742l-1.7,4.7,2.351.849A38.2,38.2,0,0,0,22,42.364V48h4V42.388C36.788,41.737,38,34.937,38,31.943Zm-22-18c0-3.66,3.114-4.935,6-5.334V19.466C17.938,17.983,16,16.617,16,13.943ZM26,37.384V26.068c4.746,1.628,7,2.991,7,5.875C33,33.335,33,36.886,26,37.384Z" fill="green"></path></g></svg>';
const  person = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 48 48"><g><path fill-rule="evenodd" clip-rule="evenodd" fill="#5A7A84" d="M24,1c-3.3077145,0-6,2.6914291-6,6s2.6922855,6,6,6 c3.3077087,0,6-2.6914291,6-6S27.3077087,1,24,1"></path> <path fill-rule="evenodd" clip-rule="evenodd" fill="#335262" d="M20.0006599,15C16.6865864,15,14,17.6780396,14,21.0033302V31 c0,0.4589996,0.3120003,0.8590012,0.7580004,0.9700012l3.3049994,0.8259964l0.941,13.2870026 C19.0470009,46.6020012,19.4790001,47,20,47h8c0.5209999,0,0.9529991-0.3979988,0.9960003-0.9169998l0.941-13.2870026 l3.3050003-0.8259964C33.6879997,31.8590012,34,31.4589996,34,31v-9.9966698C34,17.6877804,31.3234596,15,27.9993401,15H20.0006599z "></path></g></svg>';
const  reader = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 64 64"><g fill="#004888" class="nc-icon-wrapper"><path d="M32,22A10,10,0,1,1,42,12,10.011,10.011,0,0,1,32,22Z"></path><path d="M38.729,52.693A5.4,5.4,0,0,1,35,47.5,5.507,5.507,0,0,1,40.5,42a7.226,7.226,0,0,1,1,.1l.332.071L45,43.123V35.237L32.21,37.978a1.025,1.025,0,0,1-.42,0L19,35.237v7.891l3.362-1.012.136-.02a7.226,7.226,0,0,1,1-.1,5.492,5.492,0,0,1,1.636,10.738L19,54.976v3.407a1,1,0,0,0,.79.978l12,2.572a1.025,1.025,0,0,0,.42,0l12-2.572a1,1,0,0,0,.79-.978v-3.4Z" data-color="color-2"></path><path d="M60.618,51.294,50.243,28.514A6.011,6.011,0,0,0,44.783,25H19.217a6.011,6.011,0,0,0-5.46,3.514L3.39,51.276A3.954,3.954,0,0,0,3,53a3.976,3.976,0,0,0,4.913,3.888L24.54,50.829A3.493,3.493,0,0,0,23.5,44a6.243,6.243,0,0,0-.692.071l-8.453,2.542L17,42.444V34a1,1,0,0,1,1.21-.978L32,35.978l13.79-2.956A1,1,0,0,1,47,34v8.444l2.645,4.169L41.318,44.1l-.126-.03A6.243,6.243,0,0,0,40.5,44,3.5,3.5,0,0,0,37,47.5a3.46,3.46,0,0,0,2.415,3.314l16.558,6.04.114.034A3.976,3.976,0,0,0,61,53,3.925,3.925,0,0,0,60.618,51.294Z"></path></g></svg>';
const  reach = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 48 48"><g class="nc-icon-wrapper"><circle fill="#9BCED3" cx="39" cy="10" r="5"></circle> <circle fill="#9BCED3" cx="9" cy="10" r="5"></circle> <path fill-rule="evenodd" clip-rule="evenodd" fill="#76B5B5" d="M35.9966888,17C33.2370911,17,31,19.2295895,31,22.0038109 v6.7917995c0,0.5547104,0.4171391,1.1712494,0.9327698,1.3774986L34,31l0.9164581,10.9975281 C34.9626007,42.551178,35.4530411,43,35.9970284,43h6.0059433c0.5506401,0,1.0350075-0.455761,1.0805702-1.0024719L44,31 l2.0507812-0.6835899C46.5750198,30.1416607,47,29.5525093,47,29.0014992v-6.9939594C47,19.2419491,44.758419,17,42.0033112,17 H35.9966888z"></path> <path fill-rule="evenodd" clip-rule="evenodd" fill="#76B5B5" d="M5.996686,17C3.237092,17,1,19.2295895,1,22.0038109v6.7917995 c0,0.5547104,0.4171371,1.1712494,0.9327741,1.3774986L4,31l0.916461,10.9975281C4.9625978,42.551178,5.4530358,43,5.9970298,43 h6.00594c0.5506401,0,1.0350103-0.455761,1.0805702-1.0024719L14,31l2.0507812-0.6835899 C16.5750198,30.1416607,17,29.5525093,17,29.0014992v-6.9939594C17,19.2419491,14.75842,17,12.0033102,17H5.996686z"></path> <circle fill="#5A7A84" cx="24" cy="7" r="6"></circle> <path fill-rule="evenodd" clip-rule="evenodd" fill="#335262" d="M20.0006599,15C16.6865902,15,14,17.6780396,14,21.0033302v8.9958 c0,0.5527592,0.39816,1.1999512,0.8877296,1.4447289L18,33l1.0039997,13.0830002C19.0470009,46.6020012,19.4790001,47,20,47h8 c0.5209999,0,0.9529991-0.3979988,0.9960003-0.9169998l0.941-13.2870026l3.1410408-1.3884583 C33.5872307,31.1824608,34,30.5553703,34,29.9991302v-8.9958C34,17.6877804,31.3234596,15,27.9993401,15H20.0006599z"></path></g></svg>';

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
  // updateBarChart(s);
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

function add_icons(data, tag, showTagInActionCell2, showTagInActionRow2) {
  if (enable_icons){
    if (data[tag].followers > 3000000) {
      showTagInActionCell2.innerHTML += reach;
      showTagInActionCell2.innerHTML += reach;
      showTagInActionCell2.innerHTML += reach;
      showTagInActionCell2.innerHTML += reach;
      showTagInActionCell2.innerHTML += reach;
    } else if (data[tag].followers > 2000000) {
      showTagInActionCell2.innerHTML += reach;
      showTagInActionCell2.innerHTML += reach;
      showTagInActionCell2.innerHTML += reach;
      showTagInActionCell2.innerHTML += reach;
    } else if (data[tag].followers > 1000000) {
      showTagInActionCell2.innerHTML += reach;
      showTagInActionCell2.innerHTML += reach;
      showTagInActionCell2.innerHTML += reach;
    } else if (data[tag].followers > 500000) {
      showTagInActionCell2.innerHTML += reach;
      showTagInActionCell2.innerHTML += reach;
    } else if (data[tag].followers > 100000) {
      showTagInActionCell2.innerHTML += reach;
    }

    if (data[tag].followersToWriters > 500) {
      showTagInActionCell2.innerHTML += person;
      showTagInActionCell2.innerHTML += person;
      showTagInActionCell2.innerHTML += person;
      showTagInActionCell2.innerHTML += person;
      showTagInActionCell2.innerHTML += person;
    } else if (data[tag].followersToWriters > 200) {
      showTagInActionCell2.innerHTML += person;
      showTagInActionCell2.innerHTML += person;
      showTagInActionCell2.innerHTML += person;
      showTagInActionCell2.innerHTML += person;
    } else if (data[tag].followersToWriters > 100) {
      showTagInActionCell2.innerHTML += person;
      showTagInActionCell2.innerHTML += person;
      showTagInActionCell2.innerHTML += person;
    } else if (data[tag].followersToWriters > 50) {
      showTagInActionCell2.innerHTML += person;
      showTagInActionCell2.innerHTML += person;
    } else if (data[tag].followersToWriters > 5) {
      showTagInActionCell2.innerHTML += person;
    }

    if (data[tag].followersToStories > 300) {
      showTagInActionCell2.innerHTML += reader;
      showTagInActionCell2.innerHTML += reader;
      showTagInActionCell2.innerHTML += reader;
      showTagInActionCell2.innerHTML += reader;
      showTagInActionCell2.innerHTML += reader;
    } else if (data[tag].followersToStories > 100) {
      showTagInActionCell2.innerHTML += reader;
      showTagInActionCell2.innerHTML += reader;
      showTagInActionCell2.innerHTML += reader;
      showTagInActionCell2.innerHTML += reader;
    } else if (data[tag].followersToStories > 50) {
      showTagInActionCell2.innerHTML += reader;
      showTagInActionCell2.innerHTML += reader;
      showTagInActionCell2.innerHTML += reader;
    } else if (data[tag].followersToStories > 20) {
      showTagInActionCell2.innerHTML += reader;
      showTagInActionCell2.innerHTML += reader;
    } else if (data[tag].followersToStories > 5) {
      showTagInActionCell2.innerHTML += reader;
    }


    if (data[tag].followers < 250000) {
      showTagInActionCell2.innerHTML += dollar;
    }
    if (data[tag].followers < 20000) {
      showTagInActionCell2.innerHTML += dollar;
      showTagInActionCell2.innerHTML += dollar;
    } else if (data[tag].followers < 10000) {
      showTagInActionCell2.innerHTML += dollar;
      showTagInActionCell2.innerHTML += dollar;
      showTagInActionCell2.innerHTML += dollar;
    } else if (data[tag].followers < 2500) {
      showTagInActionCell2.innerHTML += dollar;
      showTagInActionCell2.innerHTML += dollar;
      showTagInActionCell2.innerHTML += dollar;
      showTagInActionCell2.innerHTML += dollar;
    } else if (data[tag].followers < 250) {
      showTagInActionCell2.innerHTML += dollar;
      showTagInActionCell2.innerHTML += dollar;
      showTagInActionCell2.innerHTML += dollar;
      showTagInActionCell2.innerHTML += dollar;
      showTagInActionCell2.innerHTML += dollar;
    }
    showTagInActionRow2.appendChild(showTagInActionCell2);
  }
}


function followersCell(followers, followersToStories, followersToWriters, storiesToWriters) {
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

function add_cells(row, data, post) {
  let viewsCountCell = row.querySelector('.views');
  if (!viewsCountCell) {
    let value = Number(data[post.postId].views);
    let hover_text = 'view';
    viewsCountCell = document.createElement('td');
    viewsCountCell.className = '.views';
    let first_span = document.createElement('span');
    first_span.className = 'sortableTable-value';
    first_span.textContent = value;
    let second_span = document.createElement('span');
    second_span.className = 'sortableTable-number';
    second_span.textContent = value;
    second_span.title = value;
    let third_span = document.createElement('span');
    third_span.className = 'u-sm-show';
    third_span.textContent = hover_text;
    viewsCountCell.appendChild(first_span);
    viewsCountCell.appendChild(second_span);
    viewsCountCell.appendChild(third_span);
    row.appendChild(viewsCountCell);
  }

  let readsCountCell = row.querySelector('.reads');
  if (!readsCountCell) {
    let value = Number(data[post.postId].reads);
    let hover_text = 'reads';
    readsCountCell = document.createElement('td');
    readsCountCell.className = '.reads';
    let first_span = document.createElement('span');
    first_span.className = 'sortableTable-value';
    first_span.textContent = value;
    let second_span = document.createElement('span');
    second_span.className = 'sortableTable-number';
    second_span.textContent = value;
    second_span.title = value;
    let third_span = document.createElement('span');
    third_span.className = 'u-sm-show';
    third_span.textContent = hover_text;
    readsCountCell.appendChild(first_span);
    readsCountCell.appendChild(second_span);
    readsCountCell.appendChild(third_span);
    row.appendChild(readsCountCell);
  }

  let readRatioCount = row.querySelector('.readsToViewsRatio');
  if (!readRatioCount) {
    let value = Math.ceil(Number((data[post.postId].reads) / Number(data[post.postId].views)) * 100);
    let hover_text = 'reads to views ratio';
    readRatioCount = document.createElement('td');
    readRatioCount.className = '.readsToViewsRatio';
    let first_span = document.createElement('span');
    first_span.className = 'sortableTable-value';
    first_span.textContent = `${value}%`;
    let second_span = document.createElement('span');
    second_span.className = 'sortableTable-number';
    second_span.textContent = `${value}%`;
    second_span.title = `${value}%`;
    let third_span = document.createElement('span');
    third_span.className = 'u-sm-show';
    third_span.textContent = hover_text;
    readRatioCount.appendChild(first_span);
    readRatioCount.appendChild(second_span);
    readRatioCount.appendChild(third_span);
    row.appendChild(readRatioCount);
  }
}

function add_tags(data, tag, showTagInAction, showTagInActionCell, showTagInActionRow, showTagInActionCell2, showTagInActionRow2) {
  const followersToStories = Math.round((Number(data[tag].followers) / Number(data[tag].stories)) * 100) / 100;
  const followersToWriters = Math.round((Number(data[tag].followers) / Number(data[tag].writers)) * 100) / 100;
  const storiesToWriters = Math.round((Number(data[tag].stories) / Number(data[tag].writers)) * 100) / 100;

  [className, title] = followersCell(data[tag].followers, followersToStories, followersToWriters, storiesToWriters);
  showTagInAction.textContent = getTagName(tag);
  showTagInAction.href = `https://medium.com/tag/${tag}`;
  showTagInAction.target = '_blank';
  showTagInAction.className = className;
  showTagInAction.title = title;
  showTagInActionCell.appendChild(showTagInAction);
  showTagInActionRow.appendChild(showTagInActionCell);

  add_icons(data, tag, showTagInActionCell2, showTagInActionRow2);
}

function process_tags(postTitleCell, data, post) {
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
      if (data[tag] === undefined || !data[tag].hasOwnProperty('lastUpdate') || (Date.now() - data[tag].lastUpdate) > 604800000) {
        loadTagDetails(tag).then(data => {
          data.tag = tag;
          chrome.storage.local.set({ [tag]: data }).then(() => {
            add_tags(data, tag, showTagInAction, showTagInActionCell, showTagInActionRow, showTagInActionCell2, showTagInActionRow2);
            return;
          });
        });
      } else {
        add_tags(data, tag, showTagInAction, showTagInActionCell, showTagInActionRow, showTagInActionCell2, showTagInActionRow2);
        return;
      }
    });

    showTagInActionTable.appendChild(showTagInActionRow);
    showTagInActionTable.appendChild(showTagInActionRow2);
    postTitleCellActions.appendChild(showTagInActionTable);
    return;
  });
}

function updateTableRows(data) {
  // const todayTotals = { views: 0, reads: 0, fans: 0, claps: 0 };
  // const fansHeadCell = document.querySelector(
  //   'table thead th:nth-child(5) button'
  // );
  // log(data)
  // fansHeadCell.innerHTML = `Fans <span class="claps">Claps</span>`;
  // fansHeadCell.title = 'Fans, Claps and Claps per Fan';

  let tableHeadRow = document.querySelector('table thead tr');

  let viewsCountHeadCell = tableHeadRow.querySelector('.viewsCount');
  if (!viewsCountHeadCell) {
    viewsCountHeadCell = document.createElement('th');
    viewsCountHeadCell.className = 'sortableTable-header disabled viewsCount';
    viewsCountHeadCell.innerHTML = `<button class="button button--chromeless u-baseColor--buttonNormal js-views">Views</button>`;
    tableHeadRow.appendChild(viewsCountHeadCell);
  }

  let readsCountHeadCell = tableHeadRow.querySelector('.readsCount');
  if (!readsCountHeadCell) {
    readsCountHeadCell = document.createElement('th');
    readsCountHeadCell.className = 'sortableTable-header disabled readsCount';
    readsCountHeadCell.innerHTML = `<button class="button button--chromeless u-baseColor--buttonNormal js-views">Member Reads</button>`;
    tableHeadRow.appendChild(readsCountHeadCell);
  }

  let readRatioCountHeadCell = tableHeadRow.querySelector('.readRatioCount');
  if (!readRatioCountHeadCell) {
    readRatioCountHeadCell = document.createElement('th');
    readRatioCountHeadCell.className = 'sortableTable-header disabled readRatioCount';
    readRatioCountHeadCell.innerHTML = `<button class="button button--chromeless u-baseColor--buttonNormal js-views">Members<br/>Read ratio</button>`;
    tableHeadRow.appendChild(readRatioCountHeadCell);
  }
  const rows = document.querySelectorAll('table tbody tr');

  Array.from(rows)
    .filter((row) => row.getAttribute('data-action-value'))
    .forEach((row) => {
      const postId = row.getAttribute('data-action-value');
      const post = data.posts.find((post) => post.postId === postId);

      const articleTitle = row.querySelector('.sortableTable-title');
      articleTitle.title = new Date(post.firstPublishedAt).toLocaleDateString();

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
              log(data)
              process_tags(postTitleCell, data, post);

              add_cells(row, data, post);
              return;
            })
            chrome.storage.local.set({ [post.postId]: { ...new Set([...post,...data]) } });
          } else {
            process_tags(postTitleCell, data, post);

            add_cells(row, data, post);
            return;
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
