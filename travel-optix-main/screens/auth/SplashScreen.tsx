import React from 'react';
import { View, Image, Text, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.9;
const LOGO_SIZE = width * 0.9;

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <View style={[styles.circle, styles.circleTopRight]} />
      <View style={[styles.circle, styles.circleBottomLeft]} />

      <View style={styles.content}>
        <Image
          source={require('../../assets/newicon_cleaned.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.heading}>Your Unified Travel Pass</Text>
        <Text style={styles.subtitle}>Explore Authentic Experiences</Text>

        <View style={styles.indicatorRow}>
          <View style={styles.dot} />
          <View style={styles.activeDot} />
          <View style={styles.dot} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: '#EEF4FB',
  },
  circleTopRight: {
    top: -CIRCLE_SIZE * 0.5,
    right: -CIRCLE_SIZE * 0.5,
  },
  circleBottomLeft: {
    bottom: -CIRCLE_SIZE * 0.5,
    left: -CIRCLE_SIZE * 0.5,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    marginBottom: 20,
  },
  heading: {
    fontSize: 30,
    fontWeight: '700',
    color: '#2563EB',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '400',
    color: '#7FA7E8',
    textAlign: 'center',
    marginTop: 12,
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#BFD4F5',
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
    marginHorizontal: 4,
  },
});