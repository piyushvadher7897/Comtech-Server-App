import React from 'react';
import {View, Image, StyleSheet, Text, StatusBar} from 'react-native';



const SplashScreen = ({onAnimationComplete}) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onAnimationComplete();
    }, 3000); // 3 seconds splash screen

    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <Image
        source={require('../../asset/images/APP_ICON.png')}
        style={styles.image}
      />
      <Text style={styles.text}>Server App</Text>
    </View>
  );
};




const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection:'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    gap:100
    
  },
  homeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  image: {
    width: 170,
    height: 170,
    resizeMode: 'contain',
  },
  text: {
    fontSize: 30,
    fontWeight: 'bold',
    color:'white',
    textAlign:'center'

  },
});



export default SplashScreen;