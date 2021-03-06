'use strict';
import PropTypes from 'prop-types';
import React, { useContext, useCallback } from 'react';
import {
  View,
  Text,
  Platform,
  Linking,
} from 'react-native';
import { GlobalStateContext, getTheme } from './StateManager';
import TextSegment from './TextSegment';
import styles from './Styles';


const TextRange = React.memo(({
  displayRef,
  showToast,
  rowData,
  segmentRef,
  showSegmentNumbers,
  textSegmentPressed,
  setRowRef,
  setRowRefInitY,
  fontScale,
  handleOpenURL,
  setDictionaryLookup,
  shareCurrentSegment,
  getDisplayedText,
  vowelToggleAvailable,
}) => {
  const { themeStr, textLanguage, biLayout, fontSize, vocalization } = useContext(GlobalStateContext);

  const theme = getTheme(themeStr);
  const _setRef = ref => {
    setRowRef(segmentRef, ref);
  };

  let enText = rowData.content.text || "";
  let heText = Sefaria.util.applyVocalizationSettings(rowData.content.he, vocalization, vowelToggleAvailable) || "";
  enText = Sefaria.util.getDisplayableHTML(enText.trim(), 'english');
  heText = Sefaria.util.getDisplayableHTML(heText.trim(), 'hebrew');
  let numLinks = rowData.content.links ? rowData.content.links.length : 0;

  const textLanguageWithContent = Sefaria.util.getTextLanguageWithContent(textLanguage, enText, heText);
  let refSection = rowData.sectionIndex + ":" + rowData.rowIndex;
  let numberMargin = (<Text
                        style={[styles.verseNumber, textLanguageWithContent == "hebrew" ? styles.hebrewVerseNumber : null, theme.verseNumber]}
                        key={segmentRef + "|segment-number"}>
                      {showSegmentNumbers ? (textLanguageWithContent == "hebrew" ?
                       Sefaria.hebrew.encodeHebrewNumeral(rowData.content.segmentNumber) :
                       rowData.content.segmentNumber) : ""}
                    </Text>);

  let bulletOpacity = (numLinks-20) / (70-20);
  if (numLinks == 0) { bulletOpacity = 0; }
  else if (bulletOpacity < 0.3) { bulletOpacity = 0.3; }
  else if (bulletOpacity > 0.8) { bulletOpacity = 0.8; }

  var bulletMargin = (<Text
                        style={[styles.verseBullet, theme.verseBullet, {opacity:bulletOpacity}]}
                        key={segmentRef + "|segment-dot"}>
                      {"●"}
                    </Text>);

  let textStyle = [styles.textSegment];
  if (rowData.highlight) {
      textStyle.push(theme.segmentHighlight);
  }
  if (biLayout === 'sidebyside') {
    textStyle.push({flexDirection: "row"})
  } else if (biLayout === 'sidebysiderev') {
    textStyle.push({flexDirection: "row-reverse"})
  }
  const showHe = textLanguageWithContent == "hebrew" || textLanguageWithContent == "bilingual";
  const showEn = textLanguageWithContent == "english" || textLanguageWithContent == "bilingual";
  const onTextPress = useCallback((onlyOpen) => {
    let key = refSection;
    let section = parseInt(key.split(":")[0]);
    let segment = parseInt(key.split(":")[1]);
    textSegmentPressed(section, segment, segmentRef, onlyOpen);
  }, [refSection, segmentRef]);
  return (
    <View
      style={styles.verseContainer}
      ref={_setRef}
    >
      <View
        style={[styles.numberSegmentHolderEn, {flexDirection: textLanguageWithContent === 'english' ? 'row' : 'row-reverse'}]}
        key={segmentRef+"|inner-box"}
      >
        { numberMargin }
        <View style={textStyle} key={segmentRef+"|text-box"}>
          {
            showHe ? (
              <View style={{flex: 4.5, paddingRight: biLayout == 'stacked' ? 0 : (biLayout == 'sidebyside' ? 10 : 0), paddingLeft: biLayout == 'stacked' ? 0 : (biLayout == 'sidebysiderev' ? 10 : 0)}}>
                {displayRef ? <Text style={[styles.he, styles.textListCitation, theme.textListCitation]}>{rowData.content.sourceHeRef}</Text> : null}
                <TextSegment
                  fontScale={fontScale}
                  fontSize={fontSize}
                  themeStr={themeStr}
                  segmentRef={segmentRef}
                  segmentKey={refSection}
                  data={heText}
                  textType="hebrew"
                  onTextPress={onTextPress}
                  showToast={showToast}
                  setDictionaryLookup={setDictionaryLookup}
                  handleOpenURL={handleOpenURL}
                  shareCurrentSegment={shareCurrentSegment}
                  getDisplayedText={getDisplayedText}
                />
              </View>
            ) : null
          }
          {
            showEn ? (
              <View style={{flex: 5.5, paddingTop: showHe ? biLayout == 'stacked' ? 20 : 5 : 0, paddingRight: biLayout == 'stacked' ? 0 : (biLayout == 'sidebyside' ? 0 : 10), paddingLeft: biLayout == 'stacked' ? 0 : (biLayout == 'sidebysiderev' ? 0 : 10)}}>
                {displayRef ? <Text style={[styles.en, styles.textListCitation, {marginTop: -19}, theme.textListCitation]}>{rowData.content.sourceRef}</Text> : null}
                <TextSegment
                  fontScale={fontScale}
                  fontSize={fontSize}
                  themeStr={themeStr}
                  segmentRef={segmentRef}
                  segmentKey={refSection}
                  data={enText}
                  textType="english"
                  bilingual={textLanguageWithContent === "bilingual"}
                  onTextPress={onTextPress}
                  showToast={showToast}
                  setDictionaryLookup={setDictionaryLookup}
                  handleOpenURL={handleOpenURL}
                  shareCurrentSegment={shareCurrentSegment}
                  getDisplayedText={getDisplayedText}
                />
              </View>
            ) : null
          }
        </View>
        { bulletMargin }
      </View>
    </View>
  );
});
TextRange.whyDidYouRender = {customName: 'TextRange'};
TextRange.propTypes = {
  showToast:          PropTypes.func.isRequired,
  rowData:            PropTypes.object.isRequired,
  segmentRef:         PropTypes.string.isRequired,
  segmentHeRef:       PropTypes.string,
  showSegmentNumbers: PropTypes.bool.isRequired,
  textSegmentPressed: PropTypes.func.isRequired,
  setRowRef:          PropTypes.func.isRequired,
  setRowRefInitY:     PropTypes.func.isRequired,
  shareCurrentSegment:PropTypes.func.isRequired,
  getDisplayedText:   PropTypes.func.isRequired,
  fontScale:          PropTypes.object,
};

export default TextRange;
