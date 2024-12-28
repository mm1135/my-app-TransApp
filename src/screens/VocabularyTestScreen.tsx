import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const VocabularyTestScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text>テスト画面</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VocabularyTestScreen; 