import React from 'react';
import {BaseToast, ErrorToast} from 'react-native-toast-message';
import Colors from '../constants/colors';
import Typography from '../constants/typography';
import {mvs} from './scaling';
import {StyleSheet} from 'react-native';

export const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: Colors.success,
        backgroundColor: Colors.white,
        borderRadius: mvs(8),
      }}
      contentContainerStyle={styles.containerToast}
      text1Style={styles.text1Toast}
      text2Style={styles.text2Toast}
    />
  ),
  info: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: Colors.info,
        backgroundColor: Colors.white,
        borderRadius: mvs(8),
      }}
      contentContainerStyle={styles.containerToast}
      text1Style={styles.text1Toast}
      text2Style={styles.text2Toast}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: Colors.error,
        backgroundColor: Colors.white,
        borderRadius: mvs(8),
      }}
      contentContainerStyle={styles.containerToast}
      text1Style={styles.text1Toast}
      text2Style={styles.text2Toast}
    />
  ),
};

const styles = StyleSheet.create({
  containerToast: {
    paddingHorizontal: mvs(8),
  },
  text1Toast: {
    fontSize: Typography.fontSize.medium,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryDark,
  },
  text2Toast: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray,
  },
});
