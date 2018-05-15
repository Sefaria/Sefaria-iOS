'use strict';
import PropTypes from 'prop-types';
import React from 'react';

import {
  TouchableOpacity,
  Text,
  View,
  TextInput
} from 'react-native';

import {
  DirectedButton,
  CloseButton,
  SearchButton,
  LanguageToggleButton,
} from './Misc.js';

import AutocompleteList from './AutocompleteList';

import styles from './Styles';
import strings from './LocalizedStrings';

class SearchBar extends React.Component {
  static propTypes = {
    interfaceLang:   PropTypes.oneOf(["english", "hebrew"]).isRequired,
    theme:           PropTypes.object.isRequired,
    themeStr:        PropTypes.string.isRequired,
    closeNav:        PropTypes.func.isRequired,
    search:          PropTypes.func.isRequired,
    setIsNewSearch:  PropTypes.func.isRequired,
    toggleLanguage:  PropTypes.func,
    language:        PropTypes.string,
    query:           PropTypes.string.isRequired,
    onChange:        PropTypes.func.isRequired,
    onFocus:         PropTypes.func,
  };

  submitSearch = () => {
    if (this.props.query) {
      this.props.setIsNewSearch(true);
      this.props.search(this.props.query, true, false, true);
    }
  };

  focus = () => {
    this._textInput.focus();
  };

  _getTextInputRef = ref => {
    this._textInput = ref;
  };

  render() {
    var textInputStyle = [styles.searchInput, this.props.interfaceLang === "hebrew" ? styles.hebrewSystemFont : null, this.props.theme.text];
    //TODO sorry for the hard-coded colors. because the prop placeholderTextColor of TextInput doesn't take a style and instead requires an explicit color string, I had to do it this way
    var placeholderTextColor = this.props.themeStr == "black" ? "#BBB" : "#777";

    //TODO make flex dependent on results. animate opening of results
    return (
      <View style={{flexDirection: 'column', flex:0}}>
        <View style={[styles.header, this.props.theme.header]}>
          {this.props.leftMenuButton == "close" ?
            <CloseButton onPress={this.props.closeNav} theme={this.props.theme} themeStr={this.props.themeStr} /> :
            <DirectedButton
              onPress={this.props.openNav}
              themeStr={this.props.themeStr}
              imageStyle={[styles.menuButton, styles.directedButton]}
              language="english"
              direction="back"/>
          }
          <SearchButton onPress={this.submitSearch} theme={this.props.theme} themeStr={this.props.themeStr} />
          <TextInput
            ref={this._getTextInputRef}
            style={textInputStyle}
            onChangeText={this.props.onChange}
            onSubmitEditing={this.submitSearch}
            onFocus={this.props.onFocus}
            value={this.props.query}
            placeholder={strings.search}
            placeholderTextColor={placeholderTextColor}
            autoCorrect={false} />
          {this.props.toggleLanguage ?
            <LanguageToggleButton
              theme={this.props.theme}
              toggleLanguage={this.props.toggleLanguage}
              language={this.props.language}
              themeStr={this.props.themeStr}
            />
             : null}
        </View>
      </View>
    );
  }
}

export default SearchBar;
