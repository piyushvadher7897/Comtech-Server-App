import {Alert} from 'react-native';

export const AlertMessage = ({
  title,
  message,
  okButton,
  okText,
  cancelText,
  cancel,
  styleCancel,
}) => {
  return Alert.alert(title, message, [
    {
      text: cancelText,
      onPress: cancel,
      style: styleCancel,
    },
    {
      text: okText,
      onPress: okButton,
    },
  ]);
};
