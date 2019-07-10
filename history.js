import AsyncStorage from '@react-native-community/async-storage';

const History = {
  saved: [],
  _hasSwipeDeleted: false,
  migrateFromOldRecents: async function() {
    const recent = await AsyncStorage.getItem("history");
    if (!!recent) {
      json = JSON.parse(recent);
      const history = json.map(r => ({
        ref: r.ref,
        he_ref: Sefaria.toHeSegmentRef(r.heRef, r.ref),
        versions: r.versions || {},
        book: Sefaria.textTitleForRef(r.ref),
      }));
      const historyStr = JSON.stringify(history);
      // 2017 12 1
      return Promise.all([
        AsyncStorage.removeItem("recent"),
        AsyncStorage.setItem("history", historyStr),
        AsyncStorage.setItem("lastSyncItems", historyStr),
        AsyncStorage.setItem("lastSyncTime", Math.floor((new Date(2017, 11, 1)).getTime()/1000)),  // Dec 1, 2017 approx date of launch of old recent items
        AsyncStorage.setItem("lastPlace", JSON.stringify(Sefaria.history.historyToLastPlace(history))),
      ]);
    }
    return Promise.resolve();
  },
  historyToLastPlace: function(history_item_array) {
    const seenBooks = {};
    const lastPlace = [];
    for (let history_item of history_item_array) {
      if (seenBooks[history_item.book]) { continue; }
      seenBooks[history_item.book] = true;
      lastPlace.push(history_item);
    }
    return lastPlace;
  },
  getHistoryObject: function({
    sheet,
    activeSheetNode,
    segmentRef,
    sectionIndexRef,
    sectionArray,
    sectionHeArray,
    selectedVersions,
    textListVisible,
  }, textLanguage) {
    // get ref to send to /api/profile/user_history
    let ref, sheet_owner, sheet_title;
    if (!!sheet) {
      ref = `Sheet ${sheet.id}${activeSheetNode ? `:${activeSheetNode}`: ''}`;
      sheet_owner = sheet.ownerName;
      sheet_title = sheet.title;
    } else {
      const heSectionRef = sectionHeArray[sectionIndexRef];
      ref = (textListVisible && segmentRef) ? segmentRef : sectionArray[sectionIndexRef];
      he_ref = (textListVisible && segmentRef) ? Sefaria.toHeSegmentRef(heSectionRef, segmentRef) : heSectionRef;
    }
    return {
      ref,
      he_ref,
      versions: selectedVersions,
      book: Sefaria.textTitleForRef(ref),
      language: textLanguage,
      sheet_owner,
      sheet_title,
    };
  },
  saveHistoryItem: async function(state, textLanguage, withIntent) {
    // history_item contains:
    // - ref, book, versions. optionally: secondary, he_ref, language
    const history_item = Sefaria.history.getHistoryObject(state, textLanguage);
    if (withIntent) {
      await Sefaria.util.timeoutPromise(3000);
      const new_history_item = Sefaria.history.getHistoryObject(state, textLanguage);
      if (new_history_item.ref !== history_item.ref) { return; /* didn't spend enough time reading */ }
    }
    const history_item_array = Array.isArray(history_item) ? history_item : [history_item];
    for (let h of history_item_array) {
      h.time_stamp = Sefaria.util.epoch_time();
    }
    Sefaria.history.lastSync = history_item_array.concat(Sefaria.history.lastSync);
    Sefaria.history.lastPlace = Sefaria.history.historyToLastPlace(history_item_array.concat(Sefaria.history.lastPlace));
    AsyncStorage.setItem("lastSyncItems", JSON.stringify(Sefaria.history.lastSync));
    AsyncStorage.setItem("lastPlace", JSON.stringify(Sefaria.history.lastPlace));
  },
  getHistoryRefForTitle: function(title) {
    //given an index title, return the ref of that title in Sefaria.history.
    //if it doesn't exist, return null
    for (let item of Sefaria.history.lastPlace) {
      if (Sefaria.textTitleForRef(item.ref) === title) { return item; }
    }
    return null;
  },
  _loadHistoryItems: async function() {
    await Sefaria.history.migrateFromOldRecents();
    const lastPlace = await AsyncStorage.getItem('lastPlace');
    const lastSync = await AsyncStorage.getItem('lastSyncItems');
    Sefaria.history.lastPlace = JSON.parse(lastPlace) || [];
    Sefaria.history.lastSync = JSON.parse(lastSync) || [];
  },
  syncHistory: async function() {
    // TODO: sync user settings
    const currHistoryStr = await AsyncStorage.getItem('history');
    let currHistory = JSON.parse(currHistoryStr) || [];
    await Sefaria.api.getAuthToken();
    if (Sefaria._auth.uid) {
      try {
        const lastSyncStr = await AsyncStorage.getItem('lastSyncItems');
        const lastSyncTime = await AsyncStorage.getItem('lastSyncTime');
        if (!lastSyncStr) { /* nothing to sync */ return currHistory; }
        const url = Sefaria.api._baseHost + "api/profile/sync";
        console.log('lastSyncTime', lastSyncTime);
        const body = Sefaria.api.urlFormEncode({user_history: lastSyncStr, last_sync: lastSyncTime});
        const response = await fetch(url, {
          method: "POST",
          body,
          headers: {
            'Authorization': `Bearer ${Sefaria._auth.token}`,
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          },
        }).then(res => res.json());
        console.log('response', response);
        await AsyncStorage.removeItem('lastSyncItems');
        await AsyncStorage.setItem('lastSyncTime', response.last_sync);
        currHistory = Sefaria.history.mergeHistory(currHistory, response.user_history);

        await AsyncStorage.setItem('lastPlace', Sefaria.history.historyToLastPlace(currHistory));
        await AsyncStorage.setItem('history', currHistory);
      } catch (e) {
        console.log('sync error', e);
        // try again later
      }
    }
    return currHistory;
  },
  mergeHistory: async function(currHistory, newHistory) {
    return newHistory.concat(currHistory).sort((a, b) => b.time_stamp - a.time_stamp);
  },
  saveSavedItem: function(item) {
    items = [item].concat(Sefaria.history.saved);
    Sefaria.history.saved = items;
    AsyncStorage.setItem("saved", JSON.stringify(items));
  },
  removeSavedItem: function(item) {
    const existingItemIndex = Sefaria.history.indexOfSaved(item.ref)
    if (existingItemIndex !== -1) {
      Sefaria.history.saved.splice(existingItemIndex, 1);
    }
    AsyncStorage.setItem("saved", JSON.stringify(Sefaria.history.saved));
    Sefaria.history._hasSwipeDeleted = true;
    AsyncStorage.setItem("hasSwipeDeleted", "true");
  },
  indexOfSaved: function(ref) {
    return Sefaria.history.saved.findIndex(existing => ref === existing.ref);
  },
  _loadSavedItems: async function() {
    const hasSwipeDeleted = await AsyncStorage.getItem("hasSwipeDeleted");
    Sefaria.history._hasSwipeDeleted = JSON.parse(hasSwipeDeleted) || false;
    const saved = await AsyncStorage.getItem("saved");
    Sefaria.saved = JSON.parse(saved) || [];
  },
};

export default History;