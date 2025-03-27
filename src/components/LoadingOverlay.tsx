import React from 'react';
import {View, ActivityIndicator, Text, StyleSheet} from 'react-native';
import Colors from '../constants/colors';
import Typography from '../constants/typography';
import {mvs} from '../utils/scaling';

type LoadingOverlayProps = {
  visible: boolean;
  message?: string;
};

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Loading...',
}) => {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color={Colors.secondaryAccent} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingBox: {
    backgroundColor: Colors.white,
    padding: mvs(24),
    borderRadius: mvs(8),
    alignItems: 'center',
    gap: mvs(12),
  },
  message: {
    fontSize: Typography.fontSize.medium,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.black,
    marginTop: mvs(8),
  },
});

export default LoadingOverlay;
