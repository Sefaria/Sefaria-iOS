'use strict';

import PropTypes from 'prop-types';
import URL from 'url-parse';
import React from 'react';

class DeepLinkRouter extends React.PureComponent {
  static propTypes = {
    openNav:                 PropTypes.func.isRequired,
    openMenu:                PropTypes.func.isRequired,
    openRef:                 PropTypes.func.isRequired,
    openUri:                 PropTypes.func.isRequired,
    openRefSheet:            PropTypes.func.isRequired,
    openSheetTag:            PropTypes.func.isRequired,
    openTextTocDirectly:     PropTypes.func.isRequired,
    openSearch:              PropTypes.func.isRequired,
    setSearchOptions:        PropTypes.func.isRequired,
    setTextLanguage:         PropTypes.func.isRequired,
    setNavigationCategories: PropTypes.func.isRequired,
  };
  constructor(props) {
    super(props);
    const routes = [
      ['^$', props.openNav],
      ['^texts$', props.openNav],
      ['^texts/(saved)$', this.openMenu, ['saved']],
      ['^texts/(history)$', this.openMenu, ['menu']],
      ['^texts/(.+)?$', this.openCats, ['cats']],
      ['^search$', this.openSearch],
      ['^(sheets)$', this.openMenu, ['menu']],
      ['^(sheets)/tags$', this.openMenu, ['menu']],
      ['^sheets/tags/(.+)$', this.openSheetTag, ['tag']],
      ['^sheets/([0-9.]+)$', this.openRefSheet, ['sheetid']],
      ['^(daf-roulette|chavruta|[Nn]echama|login|register|logout|activity|topics|people|groups|wiki|developers|request-a-text|request-a-training|contribute|faq|gala|jfn|about|donate|team|jobs|visualizations|mobile|daf-yomi|dicta-thanks|torah-tab)/?$', this.catchAll],
      ['^([^/]+)$', this.openRef, ['tref']],
      ['^.*$', this.catchAll],
    ];
    this._routes = routes.map(([ regex, func, namedCaptureGroups ]) => new Route({regex, func, namedCaptureGroups}));
  }
  openMenu = ({ menu }) => {
    this.props.openMenu(menu);
  };
  openRefSheet = ({ sheetid }) => {
    sheetid = sheetid.split(".")[0];  // throw away node number
    this.props.openRefSheet(sheetid);
  };
  openSheetTag = ({ tag }) => {
    this.props.openSheetTag(tag);
  };
  openCats = ({ cats }) => {
    cats = cats.split('/');
    this.props.openNav();
    this.props.setNavigationCategories(cats);
  };
  openRef = ({ tref, ven, vhe, aliyot, lang, url }) => {
    // wrapper for openRef to convert url params to function params
    // TODO handle sheet ref case
    const { ref, title } = Sefaria.urlToRef(tref);
    console.log("router", ref, tref);
    if (!title) { this.catchAll({ url }); return; /* open site */}
    else if (ref === title) {
      // book table of contents
      this.props.openTextTocDirectly(title);
    } else {
      // standard ref
      const enableAliyot = !!aliyot && aliyot.length > 0 && aliyot !== '0';
      const versions = { en: ven, he: vhe };
      const langMapper = {
        'en': 'english',
        'he': 'hebrew',
        'bi': 'bilingual',
      };
      if (langMapper[lang]) {
        this.props.setTextLanguage(langMapper[lang], null, true);
      }
      this.props.openRef(ref, 'deep link', versions, true, enableAliyot);
    }
  };
  openSearch = ({ q, tab, tvar, tsort, svar, ssort }) => {
    // TODO: implement tab, svar and ssort
    const isExact = !!tvar && tvar.length > 0 && tvar === '0';
    this.props.setSearchOptions(tsort, isExact, () => { this.props.openSearch(tab, q); });
  };
  catchAll = ({ url }) => {
    // runs in case no route can handle this url
    this.props.openUri(url);
  };
  route = url => {
    const u = new URL(url, Sefaria.api._baseHost);
    let { pathname, query, host, hostname } = u;
    if (!hostname.match('(?:www\.)?sefaria\.org')) {
      // this is not a sefaria URL. Route to browser
      this.catchAll({ url });
      return;
    }
    pathname = pathname.replace(/[\/\?]$/, '');  // remove trailing ? or /
    pathname = pathname.replace(/^[\/]/, '');  // remove initial /
    // es6 dict comprehension to decode query values
    query = Object.entries(query).reduce((obj, [k, v]) => { obj[k] = decodeURIComponent(v); return obj; }, {});
    for (let r of this._routes) {
      if (r.apply({ pathname, query, url })) { break; }
    }
  };
  render() { return null; }
}

class Route {
  constructor({ regex, func, namedCaptureGroups }) {
    this.regex = regex;
    this.func = func;
    this.namedCaptureGroups = namedCaptureGroups || [];
  }
  getNamedCaptureGroups = match => {
    const groups = {};
    for (let groupNum = 0; groupNum < this.namedCaptureGroups.length; groupNum++) {
      if (!!match[groupNum+1]) {
        const groupName = this.namedCaptureGroups[groupNum];
        groups[groupName] = match[groupNum+1];
      }
    }
    return groups;
  };
  apply = ({ pathname, query, url }) => {
    const m = pathname.match(this.regex);
    if (m) {
      const groups = this.getNamedCaptureGroups(m);
      this.func({ ...groups, ...query, url });
      return true;
    }
    return false;
  };
}

export default DeepLinkRouter;
