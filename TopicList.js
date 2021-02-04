'use strict';
import PropTypes from 'prop-types';
import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
} from 'react-native';
import { Topic } from './Topic';
import { useGlobalState, useRtlFlexDir } from './Hooks';
import {
  DataSourceLine,
} from './Misc';
import styles from './Styles';
import strings from './LocalizedStrings';
import {
    LoadingView,
    InterfaceTextWithFallback,
    ContentTextWithFallback
} from './Misc';

const TopicList = ({ topics, openTopic }) => {
  const topicsAggregated = Sefaria.links.aggregateTopics(topics);
  return (
    <FlatList
      data={topicsAggregated}
      ListEmptyComponent={<View style={{marginTop: 16, alignItems: "center"}}>
        <InterfaceTextWithFallback
          en={"No topics known here."}
          he={"אין נושאים ידועים."}
          extraStyles={[{fontStyle: "italic"}]}
        />
      </View>}
      renderItem={({ item }) => (
        <TopicListItem
          topic={item}
          openTopic={openTopic}
        />        
      )}
      keyExtractor={item => item.topic}
    />
  );
}
  
const TopicListItem = ({ topic, openTopic }) => {
  // TODO generalize DataSourceLine to handle ref text instead of topicTitle
  const {theme, menuLanguage} = useGlobalState();
  const flexDirection = useRtlFlexDir(menuLanguage)       
  return (
    <Pressable
      onPress={() => { openTopic(new Topic({ slug: topic.topic, ...topic })); }}
      style={[{borderBottomWidth: 1, paddingVertical: 20}, theme.bordered, styles.readerSidePadding]}
      android_ripple={{color: "#ccc"}}
    >
      <DataSourceLine dataSources={topic.dataSources} topicTitle={topic.title} flexDirection={flexDirection}>
        <ContentTextWithFallback {...topic.title} lang={menuLanguage}/>
      </DataSourceLine>
      {
        topic.description && (topic.description.en || topic.description.he) ? (
          <InterfaceTextWithFallback {...topic.description} extraStyles={[theme.tertiaryText]} lang={menuLanguage}/>
        ) : null
      }
    </Pressable>
  );
}

  export default TopicList;