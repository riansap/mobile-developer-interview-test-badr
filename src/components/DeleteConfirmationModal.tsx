import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import Colors from '../constants/colors';
import Typography from '../constants/typography';
import {mvs} from '../utils/scaling';

interface DeleteConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  visible,
  onClose,
  onConfirm,
  isDeleting = false,
  title = 'Are You Sure To Delete This?',
  message = "You can't recover data because it will be deleted permanently.",
  confirmText = 'Yes, Delete It',
  cancelText = 'Back',
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={isDeleting ? undefined : onClose}>
        <View style={styles.overlay}>
          <BlurView
            style={styles.absolute}
            blurType="dark"
            blurAmount={16}
            overlayColor="rgba(0, 45, 64, 0.4)"
          />
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>

              <TouchableOpacity
                style={[
                  styles.deleteButton,
                  isDeleting && styles.disabledButton,
                ]}
                onPress={onConfirm}
                disabled={isDeleting}>
                {isDeleting ? (
                  <ActivityIndicator size="small" color={Colors.error} />
                ) : (
                  <Text style={styles.deleteButtonText}>{confirmText}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={onClose}
                disabled={isDeleting}>
                <Text style={styles.backButtonText}>{cancelText}</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primaryDark,
  },
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  modalContainer: {
    width: mvs(328),
    backgroundColor: Colors.white,
    borderRadius: mvs(8),
    padding: mvs(24),
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.fontSize.large,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryDark,
    marginBottom: mvs(8),
    textAlign: 'center',
  },
  message: {
    fontSize: Typography.fontSize.medium,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray,
    marginBottom: mvs(24),
    textAlign: 'center',
  },
  deleteButton: {
    width: '100%',
    height: mvs(48),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: mvs(4),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: mvs(12),
  },
  deleteButtonText: {
    color: Colors.error,
    fontSize: Typography.fontSize.medium,
    fontFamily: Typography.fontFamily.bold,
  },
  backButton: {
    width: '100%',
    height: mvs(48),
    backgroundColor: Colors.primaryDark,
    borderRadius: mvs(4),
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.medium,
    fontFamily: Typography.fontFamily.bold,
  },
  disabledButton: {
    borderColor: Colors.mediumGray,
    opacity: 0.7,
  },
});

export default DeleteConfirmationModal;
