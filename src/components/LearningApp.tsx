import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native';

interface LearningAppProps {
  children: ReactNode;
}

const LearningApp: React.FC<LearningAppProps> = ({ children }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Learning App</Text>
      </View>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 60,
    backgroundColor: '#1976d2', // MUI's primary color
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 20, // for status bar
  },
  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
});

export default LearningApp; 