'use strict';

import PropTypes from 'prop-types';

import React from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import HTMLView from 'react-native-htmlview'; //to convert html'afied JSON to something react can render (https://github.com/jsdf/react-native-htmlview)
import styles from './Styles.js';
import iPad from './isIPad';


class TextSegment extends React.PureComponent {
  static propTypes = {
    theme:              PropTypes.object.isRequired,
    themeStr:           PropTypes.string.isRequired,
    rowRef:             PropTypes.string.isRequired, /* this ref keys into TextColumn.rowRefs */
    segmentKey:         PropTypes.string,
    data:               PropTypes.string,
    textType:           PropTypes.oneOf(["english","hebrew"]),
    bilingual:          PropTypes.bool,
    biLayout:           PropTypes.oneOf(["stacked", "sidebyside", "sidebysiderev"]),
    textSegmentPressed: PropTypes.func.isRequired,
    onLongPress:        PropTypes.func.isRequired,
    fontSize:           PropTypes.number.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      resetKey: 0
    };
  }
  onPressTextSegment = () => {
    let key = this.props.segmentKey;
    let section = parseInt(key.split(":")[0]);
    let segment = parseInt(key.split(":")[1]);
    this.props.textSegmentPressed(section, segment, this.props.rowRef, true);
  };

  componentWillReceiveProps(nextProps) {
    if (this.props.themeStr !== nextProps.themeStr ||
        this.props.fontSize !== nextProps.fontSize) {
      this.setState({ resetKey: !this.state.resetKey }); //hacky fix to reset htmlview when theme colors change
    }
  }
  render() {
    // console.log(this.props.segmentKey+": "+typeof(this.props.textRef));
    const isStacked = this.props.biLayout === 'stacked';
    const lineHeightMultiplierHe = Platform.OS === 'android' ? 1.3 : 1.2;
    // see this issue: https://github.com/facebook/react-native/issues/24267
    // textAlign: right doesn't work as expected for Android RTL text
    const justifyStyle = {textAlign: (isStacked && Platform.OS === 'ios') ? 'justify' : ((Platform.OS === 'ios' && this.props.textType === 'hebrew') ? 'right' : 'left')};
    const style = this.props.textType == "hebrew" ?
                  [styles.hebrewText, this.props.theme.text, justifyStyle, {fontSize: this.props.fontSize, lineHeight: this.props.fontSize * lineHeightMultiplierHe}] :
                  [styles.englishText, this.props.theme.text, justifyStyle, {fontSize: 0.8 * this.props.fontSize, lineHeight: this.props.fontSize * 1.04 }];
    if (this.props.bilingual && this.props.textType == "english") {
      if (isStacked) {
        style.push(styles.bilingualEnglishText);
      }
      style.push(this.props.theme.bilingualEnglishText);
    }
    const smallSheet = {
      small: {
        fontSize: this.props.fontSize * 0.8 * (this.props.textType === "hebrew" ? 1 : 0.8)
      },
      hediv: {
        ...styles.hediv,
        ...justifyStyle,
      },
      endiv: {
        ...styles.endiv,
        ...justifyStyle,
      }
    };
    // return (
    //   <TouchableOpacity style={{flex:1}} onPress={this.onPressTextSegment}>
    //     <Text suppressHighlighting={false} key={this.props.segmentKey} style={style}>
    //       { data }
    //     </Text>
    //   </TouchableOpacity>
    // )
    return (
           <HTMLView
             key={this.state.resetKey}
             value={this.props.data}
             stylesheet={{...styles, ...smallSheet}}
             rootComponentProps={{
                 hitSlop: {top: 10, bottom: 10, left: 10, right: 10},  // increase hit area of segments
                 onPress:this.onPressTextSegment,
                 onLongPress:this.props.onLongPress,
                 delayPressIn: 200,
               }
             }
             RootComponent={TouchableOpacity}
             textComponentProps={
               {
                 suppressHighlighting: false,
                 key:this.props.segmentKey,
                 style: style,

               }
             }
             style={{flex: this.props.textType == "hebrew" ? 4.5 : 5.5, paddingHorizontal: 10}}
           />

    );
  }
}


export default TextSegment;
