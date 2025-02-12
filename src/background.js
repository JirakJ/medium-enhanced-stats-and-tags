const API_URL = 'https://medium.com';
const timers = {};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { type, postId } = request;
  if (type === 'GET_TOTALS') {
    handleGetTotals().then(sendResponse);
  }
  if (type === 'GET_POST_STATS') {
    handleGetPostStats(postId).then(sendResponse);
  }

  if (type === 'GET_POST_STATS_TODAY') {
    handleGetPostStatsToday(postId).then(sendResponse);
  }

  if (type === 'GET_NOTIFICATIONS') {
    handleGetNotifications().then(sendResponse);
  }

  if (type === 'GET_POST_STATS_DETAIL') {
    handleGetPostStatsDetails(postId).then(sendResponse);
  }

  if (type === 'GET_TAG_DETAIL') {
    handleGetTagDetail(postId).then(sendResponse);
  }

  return true; // enable async sendResponse
});

chrome.tabs.onUpdated.addListener(
  function(tabId, changeInfo, tab) {
    log("tabId")
    log(tabId)
    log("changeInfo")
    log(changeInfo)
    log("tab")
    log(tab)
    try{
      if (tab.url && tab.status === 'complete' && !tab.url.includes("?") && tab.url.includes("tag")){
        let data= tab.url.split("/")
        log(data[data.length-2])
        if(data[data.length-2] === "tag"){
          chrome.tabs.sendMessage( tabId, {
            message: 'url_changed',
            rerender: true
          })
        }
      } else if (changeInfo.url && !changeInfo.url.includes("?") && changeInfo.includes("tag")){
        chrome.tabs.sendMessage( tabId, {
          message: 'url_changed',
          rerender: false
        })
      }
    } catch (e) {
      console.error(e)
    }
  }
);

function getTotals(url, payload) {
  let finalUrl = `${API_URL}${url}?limit=50`;
  if (!payload) {
    log(payload)
    return request(finalUrl).then((res) => getTotals(url, res));
  }
  const { value, paging } = payload;
  if (
    payload &&
    paging &&
    paging.next &&
    paging.next.to &&
    value &&
    value.length
  ) {
    finalUrl += `&to=${paging.next.to}`;
    return request(finalUrl).then((res) => {
      payload.value = [...new Set([...payload.value, ...res.value])];
      payload.paging = res.paging;
      log(payload.value)
      return getTotals(url, payload);
    });
  } else {
    return Promise.resolve(payload);
  }
}

function handleGetTotals() {
  timer('user');
  return Promise.all([getTotals('/me/stats')])
    .then(([articles]) => {
      console.log(timerToHumanReadableString('user'));
      timer('followers');
      return fetchFollowers(getUser(articles).username).then((followers) => [
        articles,
        followers,
      ]);
    })
    .then(([articles, followers]) => {
      console.log(timerToHumanReadableString('followers'));
      const user = getUser(articles);
      user.id = user.userId;
      user.isMember = user.mediumMemberAt !== 0;
      user.followers = followers;
      user.avatar = user.imageId;
      user.totals = {
        articles: calculateTotals(articles)
      };
      user.export = {
        articles: articles.value
      };

      user.export.articles.map((article, index) => {
        chrome.storage.local.get([article.postId]).then(data => {
          if(data[article.postId] === undefined || !data[article.postId].hasOwnProperty("lastUpdate") || (Date.now() - data[article.postId].lastUpdate) > 21600000){
            fetchPostDetails(article.postId).then(data => {
              user.export.articles[index].tags = data.tags;

              console.log(timerToHumanReadableString('fetchPostDetails'));
              timer('fetch-posts-details');
              article.lastUpdate = Date.now();
              chrome.storage.local.set({ [article.postId]: article }).then(() => {
                console.debug(`Data for article ${article.postId} has been saved`,article)
              });
              return;
            }).catch(err => console.error(err))
            return;
          } else {
            article = data[article.postId]
            return;
          }
        });
      })
      return { user };
    });
}

function handleGetPostStats(postId) {
  timer('post-stats');
  return request(`${API_URL}/stats/${postId}/0/${Date.now()}`).then((data) => {
    console.log(timerToHumanReadableString('post-stats'));
    return calculatePostStats(data);
  });
}

function handleGetPostStatsDetails(postId) {
  timer('post-stats-details');
  return fetchPostDetails(postId).then(data => {
    log(data);
    return data;
  });
}

function handleGetTagDetail(tag) {
  timer('tag-detail');
  return fetchTagStats(tag).then(data => {
    return data;
  });
}

function handleGetPostStatsToday(postId) {
  timer('post-stats-today');
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  console.debug(
    `${API_URL}/stats/${postId}/${todayStart.getTime()}/${Date.now()}`
  );
  return request(
    `${API_URL}/stats/${postId}/${todayStart.getTime()}/${Date.now()}`
  ).then((data) => {
    console.info(timerToHumanReadableString('post-stats-today'));
    return calculatePostStats(data);
  });
}

function handleGetNotifications() {
  timer('notifications');
  return Promise.all([
    request(`${API_URL}/_/activity-status`),
    request(`${API_URL}/me/activity?limit=50`),
  ]).then(([status, activity]) => {
    console.log(timerToHumanReadableString('notifications'));
    const TYPES = {
      post_added_to_catalog: 'post added to catalog',
      users_email_subscribed: 'email subscribed',
      users_referred_membership: 'referred membership',
      post_recommended: 'fan',
      post_recommended_rollup: 'fan',
      response_created: 'response',
      response_created_rollup: 'response',
      post_recommended_milestone: 'milestone reached',
      users_following_you_rollup: 'follower',
      users_following_you: 'follower',
      quote: 'highlight',
      quote_rollup: 'highlight',
      mention_in_post: 'mention',
      note_replied: 'note',
      post_noted: 'note',
    };
    const count = status.unreadActivityCount;
    return ((activity && activity.value) || [])
      .slice(0, count)
      .reduce((result, item) => {
        const type = TYPES[item.activityType] || 'unknown';
        const count = item.rollupItems ? item.rollupItems.length : 1;
        result[type] = result[type] ? (result[type] += count) : count;
        return result;
      }, {});
  });
}

function fetchFollowers(username) {
  return requestGraphQl({
    variables: {
      username,
    },
    query: `query UserProfileFollowersHandler($username: ID) {
    userResult(username: $username) {
        ... on User {
              id,
              username,
              socialStats {
                followerCount
              }
         }
      }
    }`,
  }).then((res) => res.data.userResult.socialStats.followerCount);
}

function fetchTagStats(tag) {
  return requestGraphQl([{
    variables: {
      tagSlug: tag,
    },
    query: `query TagFeaturesSlug($tagSlug: String!) {
      tagFeaturesFromSlug(tagSlug: $tagSlug) {
        ... on TagFeature {
        writerCount
        }
      }
    }`,
  },
    {
      variables: {
        tagSlug: tag,
      },
      query: `query TagSlug($tagSlug: String) {
      tagFromSlug(tagSlug: $tagSlug) {
      ...TopicHeaderData
      }
    }
    
    fragment TopicHeaderData on Tag {
      id
      followerCount
      postCount
    }`,
    },
    {
      variables: {
        tagSlug: tag,
      },
      query: `query RelatedTagsQuery($tagSlug: String!) {
  relatedTags(tagSlug: $tagSlug) {
    ... on Tag {
      id
      }
    }
  }`,
    }
  ]).then((res) => {
    const relatedTags = []
    res[2].data.relatedTags.map(tag => relatedTags.push(tag.id))
    const res_obj = {
      writers: res[0].data.tagFeaturesFromSlug.writerCount,
      followers: res[1].data.tagFromSlug.followerCount,
      stories: res[1].data.tagFromSlug.postCount,
      followersToStories: Number(res[1].data.tagFromSlug.followerCount/res[1].data.tagFromSlug.postCount),
      followersToWriters: Number(res[1].data.tagFromSlug.followerCount/res[0].data.tagFeaturesFromSlug.writerCount),
      storiesToWriters: Number(res[1].data.tagFromSlug.postCount/res[0].data.tagFeaturesFromSlug.writerCount),
      relatedTags: relatedTags,
      lastUpdate: Date.now()
    }
    return res_obj
  }).catch(err => console.error("fetchTagStats error", err));
}

function fetchPostDetails(postId) {
  return requestGraphQl({
    variables: {
      postId,
    },
    query: `query FullPostScreen($postId: ID!) {
  post(id: $postId) {
    ...PostContent
    ...PostMeta
  }
}
fragment PostContent on Post {
  tags {
    ...TopicHeaderData
  }
  ...PostContextData
}
fragment TopicHeaderData on Tag {
  id
}
fragment PostMeta on Post {
  id
  title
  creator {
    name
  }
  clapCount
  postResponses {
    count
  }
  canonicalUrl
  mediumUrl
  firstPublishedAt
  readingTime
}
fragment PostContextData on Post {
  id
  title
  clapCount
  postResponses {
    count
  }
}`,
  }).then((res) => {
    const tags = []
    res.data.post.tags.map(tag => tags.push(tag.id))
    const res_obj = {
      date: res.data.post.firstPublishedAt,
      id: res.data.post.id,
      creator: res.data.post.creator.name,
      title: res.data.post.title,
      tags: tags,
      clapCount: res.data.post.clapCount,
      comments: res.data.post.postResponses.count,
      readingTime: res.data.post.readingTime,
      calculatedWordCount: Number(res.data.post.readingTime)*280,
      mediumUrl: res.data.post.mediumUrl,
      canonicalUrl: res.data.post.canonicalUrl,
    }
    return res_obj
  });
}

function request(url) {
  return fetch(url, {
    credentials: 'same-origin',
    headers: {
      accept: 'application/json',
    },
  })
    .then((res) => res.text())
    .then((text) => JSON.parse(text.slice(16)).payload)
    .catch(err => console.error(err));
}

function requestGraphQl(query) {
  return fetch('https://medium.com/_/graphql', {
    method: 'post',
    credentials: 'same-origin',
    headers: {
      Accept: '*/*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(query),
  }).then((res) => res.json());
}

function getUser(data) {
  const users = (data && data.references && data.references.User) || {};
  log(Object.values(users))
  return Object.values(users)[0] || {};
}

function getCollections(data) {
  const collections =
    (data && data.references && data.references.Collection) || {};
  return Object.values(collections).filter(
    (c) => c.virtuals.permissions.canViewStats
  );
}

function calculateTotals(data) {
  const posts = (data && data.value) || [];
  const totals = {
    items: 0,
    views: 0,
    syndicatedViews: 0,
    reads: 0,
    fans: 0,
    claps: 0,
  };
  posts.forEach((article) => {
    totals.items++;
    totals.views += article.views;
    totals.syndicatedViews += article.syndicatedViews;
    totals.reads += article.reads;
    totals.fans += article.upvotes;
    totals.claps += article.claps;
  });
  totals.ratio =
    totals.views === 0 ? 0 : ((totals.reads / totals.views) * 100).toFixed(2);
  totals.clapsPerFan =
    totals.fans === 0 ? 0 : (totals.claps / totals.fans).toFixed(2);
  totals.clapsPerViewsRatio =
    totals.fans === 0 ? 0 : ((totals.claps / totals.views) * 100).toFixed(2);
  totals.fansPerReadsRatio =
    totals.fans === 0 ? 0 : ((totals.fans / totals.reads) * 100).toFixed(2);
  totals.posts = posts;
  return totals;
}

function calculatePostStats(data) {
  const stats = (data && data.value) || [];
  return stats.reduce((result, item) => {
    const date = new Date(item.collectedAt);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    result[key] = result[key] || { views: 0, reads: 0, fans: 0, claps: 0 };
    result[key].views += item.views;
    result[key].reads += item.reads;
    result[key].fans += item.upvotes;
    result[key].claps += item.claps;
    return result;
  }, {});
}

function timer(id) {
  if (!timers[id]) {
    timers[id] = self.performance.now();
  } else {
    const result = self.performance.now() - timers[id];
    delete timers[id];
    return result;
  }
}

function timerToHumanReadableString(timerName) {
  return `${timerName}: ${(timer(timerName) || 0).toFixed(2)}ms`;
}

function log(...args) {
  console.log('Medium Enhanced Stats & Tags [background] -', ...args);
}
