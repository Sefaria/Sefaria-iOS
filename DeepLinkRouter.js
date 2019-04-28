'use strict';

import PropTypes from 'prop-types';
import URL from 'url-parse';
import React from 'react';

class DeepLinkRouter extends React.PureComponent {
  static propTypes = {
    openNav:                 PropTypes.func.isRequired,
    openMenu:                PropTypes.func.isRequired,
    openRef:                 PropTypes.func.isRequired,
    openSheetTag:            PropTypes.func.isRequired,
    openTextTocDirectly:     PropTypes.func.isRequired,
    setTextLanguage:         PropTypes.func.isRequired,
    setNavigationCategories: PropTypes.func.isRequired,
  };
  constructor(props) {
    super(props);
    const routes = [
      ['^texts$', props.openNav],
      ['^texts/(?<menu>saved)$', this.openMenu],
      ['^texts/(?<menu>history)$', this.openMenu],
      ['^texts/(?<cats>.+)?$', this.openCats],
      ['^search$', null],
      ['^(?<menu>sheets)$', this.openMenu],
      ['^(?<menu>sheets)/tags$', this.openMenu],
      ['^sheets/tags/(?<tag>.+)$', this.openSheetTag],
      ['^sheets/(?<tref>[\d.]+)$', null],
      ['^(?<tref>[^/]+)$', this.openRef],
    ];
    this._routes = routes.map(r => new Route(r[0], r[1]));
  }
  openMenu = ({ menu }) => {
    this.props.openMenu(menu);
  };
  openSheetTag = ({ tag }) => {
    this.props.openSheetTag(tag);
  };
  openCats = ({ cats }) => {
    cats = cats.split('/');
    this.props.openNav();
    this.props.setNavigationCategories(cats);
  };
  openRef = ({ tref, ven, vhe, aliyot, lang }) => {
    // wrapper for openRef to convert url params to function params
    // TODO handle sheet ref case
    const { ref, title } = Sefaria.urlToRef(tref);
    if (!title) { return; /* open site */}
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
        this.props.setTextLanguage(langMapper[lang], null, null, true);
      }
      this.props.openRef(ref, 'deep link', versions, true, enableAliyot);
    }
  };
  route = url => {
    const u = new URL(url, true);  // true means parse query string
    console.log('query', url, u.query);
    let { pathname, query } = u;
    pathname = decodeURIComponent(pathname);
    pathname = pathname.replace(/[\/\?]$/, '');  // remove trailing ? or /
    pathname = pathname.replace(/^[\/]/, '');  // remove initial /
    // es6 dict comprehension to decode query values
    query = Object.entries(query).reduce((obj, [k, v]) => { obj[k] = decodeURIComponent(v); return obj; }, {});
    for (let r of this._routes) {
      if (r.apply({ pathname, query })) { break; }
    }
  };
  render() { return null; }
}

class Route {
  constructor(regex, func) {
    this.regex = regex;
    this.func = func;
  }
  apply = ({ pathname, query }) => {
    console.log("query after", query);
    const m = pathname.match(this.regex);
    if (m) {
      console.log('routed', pathname);
      const groups = m.groups || {};
      this.func({...groups, ...query});
      return true;
    }
    return false;
  };
}

export default DeepLinkRouter;
