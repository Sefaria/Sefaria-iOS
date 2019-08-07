'use strict';

import PropTypes from 'prop-types';
import React, { useContext, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ScrollView,
  Alert,
} from 'react-native';
import VersionNumber from 'react-native-version-number';

import ProgressBar from './ProgressBar';
import {
  CategoryColorLine,
  CloseButton,
  ButtonToggleSet,
  LibraryNavButton,
  SefariaProgressBar,
} from './Misc.js';
import { GlobalStateContext, DispatchContext, STATE_ACTIONS } from './StateManager';
import styles from './Styles';
import strings from './LocalizedStrings';

generateOptions = (options, onPress) => options.map(o => ({
  name: o,
  text: strings[o],
  onPress: () => { onPress(o); },
}));


const SettingsPage = ({ close }) => {
  const offlinePackageListRef = useRef(null);
  const [numPressesDebug, setNumPressesDebug] = useState(0);
  const { theme, interfaceLanguage } = useContext(GlobalStateContext);

  const deleteLibrary = async () => {
    await Sefaria.downloader.deleteLibrary()
    offlinePackageListRef && offlinePackageListRef.updateStateBasedOnPkgData();
  };

  const onDebugNoLibraryTouch = () => {
    setNumPressesDebug(numPressesDebug+1);
    if (numPressesDebug >= 7) {
      setNumPressesDebug(0);
      Sefaria.downloader._setData("debugNoLibrary",!Sefaria.downloader._data.debugNoLibrary);
      Alert.alert(
        'Testing Library Mode',
        `You\'ve just ${Sefaria.downloader._data.debugNoLibrary ? "disabled" : "enabled"} library access. You can change this setting by tapping "OFFLINE ACCESS" seven times.`,
        [
          {text: 'OK', onPress: ()=>{}},
        ]
      );
    }
  };

  const langStyle = interfaceLanguage === "hebrew" ? styles.heInt : styles.enInt;
  var nDownloaded = Sefaria.downloader.titlesDownloaded().length;
  var nAvailable  = Sefaria.downloader.titlesAvailable().length;
  var nUpdates    = Sefaria.downloader.updatesAvailable().length;
  var updatesOnly = !!nUpdates && nDownloaded == nAvailable
  return (
    <View style={[styles.menu, theme.menu]}>
      <CategoryColorLine category={"Other"} />
      <View style={[styles.header, theme.header]}>
        <CloseButton onPress={close} />
        <Text style={[langStyle, styles.settingsHeader, theme.text]}>{strings.settings.toUpperCase()}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.menuContent}>

        <ButtonToggleSection

        />

        <View style={[styles.readerDisplayOptionsMenuDivider, styles.settingsDivider, theme.readerDisplayOptionsMenuDivider]}/>

        <TouchableWithoutFeedback onPress={onDebugNoLibraryTouch}>
          <View>
            <Text style={[langStyle, styles.settingsSectionHeader, theme.tertiaryText]}>{strings.offlineAccess}</Text>
          </View>
        </TouchableWithoutFeedback>

        { Sefaria.downloader._data.debugNoLibrary ?
          <Text style={[langStyle, styles.settingsMessage, theme.tertiaryText]}>Debug No Library</Text>
          : null
        }

        {Sefaria.downloader._data.shouldDownload ?
          <View>
            { !!nUpdates && !updatesOnly && !Sefaria.downloader.downloading ?
              <TouchableOpacity style={styles.button} onPress={Sefaria.downloader.resumeDownload}>
                <Text style={[langStyle, styles.buttonText]}>{strings.resumeDownload}</Text>
              </TouchableOpacity>
              : null }

            <TouchableOpacity style={styles.button} disabled={Sefaria.downloader.checkingForUpdates} onPress={Sefaria.downloader.checkForUpdates}>
              <Text style={[langStyle, styles.buttonText]}>{Sefaria.downloader.checkingForUpdates ? strings.checking : strings.checkForUpdates}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={deleteLibrary}>
              <Text style={[langStyle, styles.buttonText]}>{strings.deleteLibrary}</Text>
            </TouchableOpacity>
          </View>
          : null
        }
        <OfflinePackageList ref={offlinePackageListRef} />
        <View style={[styles.readerDisplayOptionsMenuDivider, styles.settingsDivider, styles.underOfflinePackages, theme.readerDisplayOptionsMenuDivider]}/>
        <View>
          <Text style={[langStyle, styles.settingsSectionHeader, theme.tertiaryText]}>
            {strings.appVersion}: {VersionNumber.appVersion}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
SettingsPage.propTypes = {
  close: PropTypes.func.isRequired,
};

const ButtonToggleSection = () => {
  const dispatch = useContext(DispatchContext);
  const globalState = useContext(GlobalStateContext);
  const setInterfaceLanguage = language => {
    dispatch({
      type: STATE_ACTIONS.setInterfaceLanguage,
      language,
    });
  };
  const setDefaultTextLanguage = language => {
    const dispatch = useContext(DispatchContext);
    dispatch({
      type: STATE_ACTIONS.setDefaultTextLanguage,
      language,
    })
  };
  const setEmailFrequency = freq => {
    const dispatch = useContext(DispatchContext);
    dispatch({
      type: STATE_ACTIONS.setEmailFrequency,
      freq,
    });
  };
  const setPreferredCustom = custom => {
    const dispatch = useContext(DispatchContext);
    dispatch({
      type: STATE_ACTIONS.setPreferredCustom,
      custom,
    });
  };
  const options = {
    interfaceLanguageOptions: generateOptions(['english', 'hebrew'], setInterfaceLanguage),
    defaultTextLanguageOptions: generateOptions(['english', 'bilingual', 'hebrew'], setDefaultTextLanguage),
    emailFrequencyOptions: generateOptions(['daily', 'weekly', 'never'], setEmailFrequency),
    preferredCustomOptions: generateOptions(['sephardi', 'ashkenazi'], setPreferredCustom),
  };

  return (
    ['defaultTextLanguage', 'interfaceLanguage', 'emailFrequency', 'preferredCustom'].map(s => (
      <View style={styles.settingsSection}>
        <View>
          <Text style={[langStyle, styles.settingsSectionHeader, context.theme.tertiaryText]}>{strings[s]}</Text>
        </View>
        <ButtonToggleSet
          options={options[`${s}Options`]}
          lang={context.interfaceLanguage}
          active={context[s]} />
      </View>
    ))
  );
};

const onPressDisabled = (child, parent) => {
  Alert.alert(
    strings.alreadyDownloaded,
    `${strings.areIncludedIn} "${parent}"`,
    [
      {text: strings.ok, onPress: () => {}}
    ]
  );
};

const useGetPkgState = onPress => {
  const { interfaceLanguage } = useContext(GlobalStateContext);
  const getStateBasedOnPkgData = () => {
    const onPressFuncs = {};
    const isDisabledObj = {};
    for (let pkgObj of Sefaria.packages.available) {
      const parent = Sefaria.packages.getSelectedParent(pkgObj.en);
      const shortIntLang = interfaceLanguage.slice(0,2);
      //NOTE: onPressDisabled() takes pkgNames in curr intLang while onPress() takes eng
      const onPress = !!parent ? onPressDisabled.bind(null, pkgObj[shortIntLang], parent[shortIntLang]) : onPress.bind(null, pkgObj.en);
      onPressFuncs[pkgObj.en] = onPress;
      isDisabledObj[pkgObj.en] = !!parent;
    }
    return ({
      onPressFuncs,
      isDisabledObj,
    });
  };
  return getStateBasedOnPkgData;
}
const usePkgState = () => {
  const [pkgState, setPkgState] = useState(getStateBasedOnPkgData());
  const onPress = async (pkgName) => {
    await Sefaria.packages.updateSelected(pkgName);
    setPkgState(getStateBasedOnPkgData());
  };
  return {
    pkgState,
    onPress,
  };
}


const OfflinePackageList = () => {
  const {
    pkgState,
    onPress,
  } = usePkgState();
  const getStateBasedOnPkgData = useGetPkgState(onPress);
  // num available = all available filtered to p.indexes or unfiltered
  // nupdates = all updates filtered to p.indexes or unfiltered
  return (
    <View style={styles.settingsOfflinePackages}>
      {
        Sefaria.packages.available.map(p => {
          const isSelected = Sefaria.packages.isSelected(p.en);
          const isD = Sefaria.downloader.downloading && isSelected;
          const nAvailable = isD ? Sefaria.downloader.titlesAvailable().filter(t => Sefaria.packages.titleInPackage(t, p.en)).length : 0;
          const { newBooks, updates } = Sefaria.downloader.updatesAvailable();
          const allUpdates = newBooks.concat(updates);
          const nUpdates   = isD ? allUpdates.filter(t => Sefaria.packages.titleInPackage(t, p.en)).length : 0;
          return (
            <View key={`${p.en}|${pkgState.isDisabledObj[p.en]}|parent`}>
              <LibraryNavButton
                catColor={Sefaria.palette.categoryColor(p.color)}
                enText={p.en}
                heText={p.he}
                count={`${Math.round(p.size / 1e6)}mb` /* NOTE: iOS uses 1e6 def of mb*/}
                onPress={pkgState.onPressFuncs[p.en]}
                onPressCheckBox={pkgState.onPressFuncs[p.en]}
                checkBoxSelected={0+isSelected}
                buttonStyle={{margin: 0, padding: 0, opacity: pkgState.isDisabledObj[p.en] ? 0.6 : 1.0}}
                withArrow={false}
              />
            { isD && nUpdates > 0 ?
                <SefariaProgressBar
                  progress={(nAvailable - nUpdates) / (nAvailable)}
                /> : null
              }
            </View>
          );
        })
    }
  </View>
  );
}

export default SettingsPage;
