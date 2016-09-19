'use strict';

import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView
} from 'react-native';

var {
  CategoryColorLine,
  TwoBox,
  LanguageToggleButton,
  MenuButton,
  DisplaySettingsButton,
  ToggleSet,
  LoadingView
} = require('./Misc.js');

var styles = require('./Styles.js');


var ReaderNavigationCategoryMenu = React.createClass({
  // Navigation Menu for a single category of texts (e.g., "Tanakh", "Bavli")
  propTypes: {
    theme:          React.PropTypes.object.isRequired,
    category:       React.PropTypes.string.isRequired,
    categories:     React.PropTypes.array.isRequired,
    closeNav:       React.PropTypes.func.isRequired,
    setCategories:  React.PropTypes.func.isRequired,
    openRef:        React.PropTypes.func.isRequired,
    navHome:        React.PropTypes.func.isRequired,
    toggleLanguage: React.PropTypes.func.isRequired,
    settings:       React.PropTypes.object.isRequired,
    Sefaria:        React.PropTypes.object.isRequired
  },
  getInitialState: function() {
    Sefaria = this.props.Sefaria;
    return {};
  },
  render: function() {
    var showHebrew = this.props.settings.language == "hebrew";

    // Show Talmud with Toggles
    var categories  = this.props.categories[0] === "Talmud" && this.props.categories.length == 1 ?
                        ["Talmud", "Bavli"] : this.props.categories;


    if (categories[0] === "Talmud") {
      var options = [{
        name: "Bavli",
        text: "Bavli",
        heText: "בבלי",
        onPress: this.props.setCategories.bind(null, ["Talmud", "Bavli"])
      },
      {
        name: "Yerushalmi",
        text: "Yerushalmi",
        heText: "ירושלמי",
        onPress: this.props.setCategories.bind(null, ["Talmud", "Yerushalmi"])
      }];

      var toggle = <ToggleSet
                      theme={this.props.theme}
                      options={options}
                      active={categories[1]}
                      contentLang={this.props.settings.language} />;
    } else {
      var toggle = null;
    }

    if (!Sefaria.toc) { return (<LoadingView />); }

    var catContents = Sefaria.tocItemsByCategories(categories);
    return (<View style={[styles.menu,this.props.theme.menu]}>
              <CategoryColorLine category={this.props.category} />
              <View style={[styles.header, this.props.theme.header]}>
                <CategoryColorLine category={categories[0]} />
                <MenuButton onPress={this.props.navHome} theme={this.props.theme}/>
                {showHebrew ?
                  <Text style={styles.he, styles.categoryTitle}>{Sefaria.hebrewCategory(this.props.category)}</Text> :
                  <Text style={styles.en, styles.categoryTitle}>{this.props.category}</Text> }
                <DisplaySettingsButton onPress={this.props.openDisplaySettings} />
              </View>

              <ScrollView style={styles.menuContent}>
                  {toggle}
                  <ReaderNavigationCategoryMenuContents
                    theme={this.props.theme}
                    contents={catContents}
                    categories={categories}
                    setCategories={this.props.setCategories}
                    openRef={this.props.openRef}
                    settings={this.props.settings} />
              </ScrollView>
            </View>);
  }
});


var ReaderNavigationCategoryMenuContents = React.createClass({
  // Inner content of Category menu (just category title and boxes)
  propTypes: {
    theme:         React.PropTypes.object.isRequired,
    contents:      React.PropTypes.array.isRequired,
    categories:    React.PropTypes.array.isRequired,
    setCategories: React.PropTypes.func.isRequired,
    openRef:       React.PropTypes.func.isRequired,
    settings:      React.PropTypes.object.isRequired
  },
  render: function() {
      var content = [];
      var showHebrew = this.props.settings.language == "hebrew";
      var cats = this.props.categories || [];
      for (var i = 0; i < this.props.contents.length; i++) {
        var item = this.props.contents[i];
        if (item.category) {
          if (item.category == "Commentary") { continue; }
          var newCats = cats.concat(item.category);
          // Special Case categories which should nest
          var subcats = [ "Mishneh Torah", "Shulchan Arukh", "Midrash Rabbah", "Maharal" ];
          if (Sefaria.util.inArray(item.category, subcats) > -1) {
            var openCat = this.props.setCategories.bind(null, newCats);
            content.push((<TouchableOpacity onPress={openCat} style={[styles.textBlockLink,this.props.theme.textBlockLink]} key={i}>
                            { showHebrew ?
                              <Text style={[styles.he, styles.centerText]}>{Sefaria.hebrewCategory(item.category)}</Text> :
                              <Text style={[styles.en, styles.centerText]}>{item.category}</Text> }
                          </TouchableOpacity>));
            continue;
          }
          // Add a Category
          content.push((<View style={styles.category} key={i}>
                          { showHebrew ?
                              <Text style={[styles.he, styles.categorySectionTitle, this.props.theme.categorySectionTitle]}>{item.heCategory}</Text> :
                              <Text style={[styles.en, styles.categorySectionTitle, this.props.theme.categorySectionTitle]}>{item.category}</Text> }
                          <ReaderNavigationCategoryMenuContents
                            theme={this.props.theme}
                            contents={item.contents}
                            categories={newCats}
                            setCategories={this.props.setCategories}
                            openRef={this.props.openRef}
                            settings={this.props.settings} />
                        </View>));
        } else {
          // Add a Text
          var title   = item.title.replace(/(Mishneh Torah,|Shulchan Arukh,|Jerusalem Talmud) /, "");
          var heTitle = item.heTitle.replace(/(משנה תורה,|תלמוד ירושלמי) /, "");
          var openRef = this.props.openRef.bind(null, item.firstSection);
          content.push((<TouchableOpacity  style={[styles.textBlockLink,this.props.theme.textBlockLink]}  onPress={openRef} key={i}>
                            { showHebrew ?
                              <Text style={[styles.he, styles.centerText]}>{heTitle}</Text> :
                              <Text style={[styles.en, styles.centerText]}>{title}</Text> }
                          </TouchableOpacity>));
        }
      }
      var boxedContent = [];
      var currentRun   = [];
      for (var i = 0; i < content.length; i++) {
        // Walk through content looking for runs of texts/subcats to group together into a table
        if (content[i].type.displayName == "View") { // this is a subcategory
          if (currentRun.length) {
            boxedContent.push((<TwoBox content={currentRun} key={i} />));
            currentRun = [];
          }
          boxedContent.push(content[i]);
        } else  { // this is a single text
          currentRun.push(content[i]);
        }
      }
      if (currentRun.length) {
        boxedContent.push((<TwoBox content={currentRun} key={i} />));
      }
      return (<View>{boxedContent}</View>);
  }
});


module.exports = ReaderNavigationCategoryMenu;
