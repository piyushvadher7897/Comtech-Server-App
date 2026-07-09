import {Alert} from 'react-native';

export const AlertMessage = ({
  title,
  message,
  okButton,
  okText = 'OK',
  cancelText,
  cancel,
  styleCancel,
}) => {
  const buttons = [];

  if (cancelText) {
    buttons.push({
      text: cancelText,
      onPress: cancel,
      style: styleCancel,
    });
  }

  buttons.push({
    text: okText,
    onPress: okButton,
  });

  return Alert.alert(title, message, buttons);
};
