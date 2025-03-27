import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Colors from '../constants/colors';
import Typography from '../constants/typography';
import {mvs} from '../utils/scaling';

type AppHeaderProps = {
  title: string;
  leftComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  showLeft?: boolean;
  showRight?: boolean;
};

const AppHeader = ({
  title,
  leftComponent,
  rightComponent,
  onLeftPress,
  onRightPress,
  showLeft = true,
  showRight = false,
}: AppHeaderProps) => {
  return (
    <View style={styles.header}>
      <View style={styles.leftContainer}>
        {showLeft && leftComponent && (
          <TouchableOpacity onPress={onLeftPress}>
            {leftComponent}
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.rightContainer}>
        {showRight && rightComponent && (
          <TouchableOpacity onPress={onRightPress}>
            {rightComponent}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    height: mvs(56),
    backgroundColor: Colors.white,
    alignItems: 'center',
    paddingHorizontal: mvs(16),
    borderBottomWidth: 1,
    borderBottomColor: Colors.mediumGray,
  },
  leftContainer: {
    width: mvs(40),
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightContainer: {
    width: mvs(40),
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.fontSize.large,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },
});

export default AppHeader;
