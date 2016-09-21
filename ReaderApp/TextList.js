'use strict';
import React, { Component } from 'react';
import {
  View,
  ScrollView,
  ListView,
  Text,
  TouchableOpacity,
  Dimensions
} from 'react-native';
const styles         = require('./Styles.js');
const HTMLView       = require('react-native-htmlview');
const TextListHeader = require('./TextListHeader');
const ViewPort = Dimensions.get('window');
const LinkFilter = require('./LinkFilter');

const {
  CategoryColorLine,
  TwoBox
} = require('./Misc.js');


var TextList = React.createClass({
  propTypes: {
    settings:        React.PropTypes.object,
    openRef:         React.PropTypes.func.isRequired,
    openCat:         React.PropTypes.func.isRequired,
    closeCat:        React.PropTypes.func.isRequired,
    updateCat:       React.PropTypes.func.isRequired,
    onLinkLoad:      React.PropTypes.func.isRequired,
    linkSummary:     React.PropTypes.array,
    linkContents:    React.PropTypes.array,
    segmentIndexRef: React.PropTypes.number,
    filterIndex:     React.PropTypes.number,
    recentFilters:   React.PropTypes.array, /* of the form [{title,heTitle,refList}...] */
    columnLanguage:  React.PropTypes.string
  },
  getInitialState: function() {
    Sefaria = this.props.Sefaria; //Is this bad practice to use getInitialState() as an init function
    return {
      dataSource: new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})
    };
  },
  renderRow: function(linkContentObj, sectionId, rowId) {
    var ref = this.props.recentFilters[this.props.filterIndex].refList[rowId];
    var loading = false;
    if (linkContentObj == null) {
      loading = true;
      this.props.loadLinkContent(ref, rowId);
      linkContentObj = {en: "Loading...", he: "טוען..."};
    }

    return (<LinkContent
              theme={this.props.theme}
              settings={this.props.settings}
              openRef={this.props.openRef}
              refStr={ref}
              linkContentObj={linkContentObj}
              columnLanguage={this.props.columnLanguage}
              loading={loading}
              key={rowId} />);
  },
  render: function() {
    var isSummaryMode = this.props.filterIndex == null;
    if (isSummaryMode) {

      var viewList = [];
      this.props.linkSummary.map((cat)=>{
        viewList.push(
          <LinkCategory
            theme={this.props.theme}
            category={cat.category}
            refList={cat.refList}
            count={cat.count}
            language={"english"}
            openCat={this.props.openCat}
            key={cat.category} />);
        var innerViewList = cat.books.map((obook)=>{
          return (
          <LinkBook
            theme={this.props.theme}
            title={obook.title}
            heTitle={obook.heTitle}
            category={cat.category}
            refList={obook.refList}
            count={obook.count}
            language={"english"}
            openCat={this.props.openCat}
            key={obook.title} />);
        });
        viewList.push(<TwoBox content={innerViewList} key={cat.category+"-container"} />);

      });
    } else {
      var dataSourceRows = this.state.dataSource.cloneWithRows(this.props.linkContents);
    }

    if (isSummaryMode) {
       return (<ScrollView>
                  {viewList}
                </ScrollView>);
    } else {
      return (
      <View style={styles.textListContentOuter}>
        <TextListHeader
          Sefaria={Sefaria}
          theme={this.props.theme}
          updateCat={this.props.updateCat}
          closeCat={this.props.closeCat}
          category={this.props.recentFilters[this.props.filterIndex].category}
          filterIndex={this.props.filterIndex}
          recentFilters={this.props.recentFilters}
          columnLanguage={this.props.columnLanguage} />
        {this.props.linkContents.length == 0 ?
          <View style={styles.noLinks}><HTMLView value={"<i>No connections available.</i>"}/></View>:
          <ListView style={styles.textListContentListView}
            dataSource={dataSourceRows}
            renderRow={this.renderRow} />
        }
      </View>
      );
    }
  }
});


var LinkCategory = React.createClass({
  propTypes: {
    theme:    React.PropTypes.object.isRequired,
    openCat:  React.PropTypes.func.isRequired,
    category: React.PropTypes.string,
    refList:  React.PropTypes.array,
    language: React.PropTypes.string,
    count:    React.PropTypes.number
  },
  render: function() {
    var countStr = " | " + this.props.count;
    var style = {"borderColor": Sefaria.palette.categoryColor(this.props.category)};
    var heCategory = Sefaria.hebrewCategory(this.props.category);
    var content = this.props.language == "english"?
      (<Text style={[styles.en, this.props.theme.text]}>{this.props.category.toUpperCase() + countStr}</Text>) :
      (<Text style={[styles.he, this.props.theme.text]}>{heCategory + countStr}</Text>);

    var filter = new LinkFilter(this.props.category,heCategory,this.props.refList,this.props.category);
    return (<TouchableOpacity
              style={[styles.readerNavCategory, this.props.theme.readerNavCategory, style]}
              onPress={()=>{this.props.openCat(filter)}}>
              {content}
            </TouchableOpacity>);
  }
});


var LinkBook = React.createClass({
  propTypes: {
    theme:    React.PropTypes.object.isRequired,
    openCat:  React.PropTypes.func.isRequired,
    title:    React.PropTypes.string,
    heTitle:  React.PropTypes.string,
    category: React.PropTypes.string,
    refList:  React.PropTypes.array,
    language: React.PropTypes.string,
    count:    React.PropTypes.number
  },
  render: function() {
    var countStr = " (" + this.props.count + ")";
    var filter = new LinkFilter(this.props.title,this.props.heTitle,this.props.refList,this.props.category);
    return (
      <TouchableOpacity
        style={[styles.textBlockLink,this.props.theme.textBlockLink]}
        onPress={()=>{this.props.openCat(filter)}}>
        { this.props.language == "hebrew" ?
          <Text style={[styles.he, styles.centerText, this.props.theme.text]}>{this.props.heTitle + countStr}</Text> :
          <Text style={[styles.en, styles.centerText, this.props.theme.text]}>{this.props.title + countStr}</Text> }
      </TouchableOpacity>
    );
  }
});


var LinkContent = React.createClass({
  propTypes: {
    theme:             React.PropTypes.object.isRequired,
    settings:          React.PropTypes.object,
    openRef:           React.PropTypes.func.isRequired,
    refStr:            React.PropTypes.string,
    linkContentObj:    React.PropTypes.object, /* of the form {en,he} */
    columnLanguage:    React.PropTypes.string,
    loading:           React.PropTypes.bool
  },
  render: function() {
    var lco = this.props.linkContentObj;
    var lang = Sefaria.util.getColumnLanguageWithContent(this.props.columnLanguage,lco.en,lco.he);
    var textViews = [];

    var hebrewElem =  <Text style={[styles.hebrewText, this.props.theme.text, {fontSize:this.props.settings.fontSize}]} key={this.props.refStr+"-he"}><HTMLView stylesheet={styles} value={lco.he}/></Text>;
    var englishElem = <Text style={[styles.englishText, this.props.theme.text, {fontSize:0.8*this.props.settings.fontSize}]} key={this.props.refStr+"-en"}><HTMLView stylesheet={styles} value={lco.en}/></Text>;
    if (lang == "bilingual") {
      textViews = [hebrewElem,englishElem];
    } else if (lang == "hebrew") {
      textViews = [hebrewElem];
    } else if (lang == "english") {
      textViews = [englishElem];
    }

    return (
      <TouchableOpacity style={styles.searchTextResult} onPress={()=>{this.props.openRef(this.props.refStr, true)}}>
        <Text style={[this.props.theme.text]}>{this.props.refStr}</Text>
        {textViews}
      </TouchableOpacity>
    );
  }
});


module.exports = TextList;
