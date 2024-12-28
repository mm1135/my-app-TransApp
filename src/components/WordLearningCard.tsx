import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import { VocabularyItem } from '../types/vocabulary';

interface Props {
  word: VocabularyItem;
  onResult: (remembered: boolean) => void;
  onNext: () => void;
}

export const WordLearningCard: React.FC<Props> = ({ word, onResult, onNext }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  const flipAnimation = new Animated.Value(0);

  const flipCard = () => {
    Animated.spring(flipAnimation, {
      toValue: isFlipped ? 0 : 180,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();

    setIsFlipped(!isFlipped);
    if (!isFlipped) {
      setTimeout(() => setShowButtons(true), 500);
    } else {
      setShowButtons(false);
    }
  };

  const handleResult = (remembered: boolean) => {
    onResult(remembered);
    setIsFlipped(false);
    setShowButtons(false);
    flipAnimation.setValue(0);
    onNext();
  };

  const frontAnimatedStyle = {
    transform: [
      {
        rotateY: flipAnimation.interpolate({
          inputRange: [0, 180],
          outputRange: ['0deg', '180deg'],
        }),
      },
    ],
  };

  const backAnimatedStyle = {
    transform: [
      {
        rotateY: flipAnimation.interpolate({
          inputRange: [0, 180],
          outputRange: ['180deg', '360deg'],
        }),
      },
    ],
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={flipCard} activeOpacity={0.9}>
        <View style={styles.cardContainer}>
          <Animated.View style={[styles.card, styles.frontCard, frontAnimatedStyle]}>
            <Text style={styles.wordText}>{word.word}</Text>
            {word.userImage && (
              <Image source={{ uri: word.userImage }} style={styles.image} />
            )}
          </Animated.View>

          <Animated.View style={[styles.card, styles.backCard, backAnimatedStyle]}>
            <Text style={styles.translationText}>{word.japaneseTranslation}</Text>
            <View style={styles.exampleContainer}>
              <Text style={styles.exampleLabel}>例文：</Text>
              <Text style={styles.exampleText}>{word.videoInfo.subtitle}</Text>
              <Text style={styles.translatedExample}>
                {word.videoInfo.translatedSubtitle}
              </Text>
            </View>
          </Animated.View>
        </View>
      </TouchableOpacity>

      {showButtons && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.againButton]}
            onPress={() => handleResult(false)}
          >
            <Text style={styles.buttonText}>もう一度</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.goodButton]}
            onPress={() => handleResult(true)}
          >
            <Text style={styles.buttonText}>覚えた</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  cardContainer: {
    width: width - 40,
    height: 400,
    position: 'relative',
  },
  card: {
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    position: 'absolute',
    backfaceVisibility: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  frontCard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backCard: {
    transform: [{ rotateY: '180deg' }],
  },
  wordText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  translationText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 20,
    textAlign: 'center',
  },
  exampleContainer: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
  },
  exampleLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 16,
    marginBottom: 8,
    lineHeight: 24,
  },
  translatedExample: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 10,
    alignItems: 'center',
  },
  againButton: {
    backgroundColor: '#FF5252',
  },
  goodButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 