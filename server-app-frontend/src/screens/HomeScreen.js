import React, { useEffect, useRef, useState } from 'react';
import {View, Text, StyleSheet, Image, ScrollView, ImageBackground, RefreshControl, Dimensions} from 'react-native';
import ServerStatus from '../screens/ServerStatus';
import { APP_URL } from '../global/constant';
import { io } from 'socket.io-client';





const socket = io(APP_URL);

const HomeScreen = ({navigation}) => {

  const [price, setPrice] = useState({
    loading: true,
    price: 0,
  });
  const [ismarket, setIsMarket] = useState(false);
  const [DCOGprice, setDCOGPrice] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
const serverStatusRef = useRef();

  const onRefresh = () => {
    setRefreshing(true);
    socket.emit("getprice");
    // Tell ServerStatus to refresh
    if (serverStatusRef.current) {
      console.log("----P",serverStatusRef.current())
      serverStatusRef.current();
    }
    setTimeout(() => setRefreshing(false), 2000);
  };

  useEffect(() => {
    const updatePrice = (data) => {
      console.log("data", data);
      setIsMarket(data.isMarket);
      setPrice({ price: data.stonexprice * 3.675, loading: false });
      setDCOGPrice(data.goldRate);
      setRefreshing(false);
    };
    socket.on("getprice", updatePrice);
    return () => {
      socket.off("getprice", updatePrice);
    };
  }, []);
  //  useEffect(() => {
  //     const updatePrice = (data) => (
      
  //       setPrice({price:data.stonexprice * 3.675, loading: false}), 
  //       setDCOGPrice(data.goldRate)
  //     )
  //     // const updateDCOGPrice = (data) => console.log("data", data);
  //     socket.on("getprice", updatePrice);
  //     // socket.on("DCOGprice", updateDCOGPrice);
  //     return () => {
  //       socket.off("getprice", updatePrice);
  //       // socket.off("DCOGprice", updateDCOGPrice);
  //     };
  //   }, []);


  
  return (

    <ImageBackground 
  source={require('../../asset/images/bg-img.png')} // your background image path
  style={styles.backgroundImage}
  resizeMode="cover"
>

    <ScrollView 
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Image 
            style={styles.logo} 
            source={require("../../asset/images/logo-white.png")}
          />
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.rowContainer}>
            <View style={styles.boxStyle}>
              <Text style={styles.boxText}>StoneX Gold Price (24K)</Text>
              <Text style={[styles.boxText, styles.boldText]}>{price && price.price.toFixed(4)}</Text>
            </View>
            <View style={styles.boxStyle}>
              <Text style={styles.boxText}>DGJG Gold Price (24K)</Text>
              <Text style={[styles.boxText, styles.boldText]}>{DCOGprice}</Text>
            </View>
          </View>
          
          <View style={styles.rowContainer}>
            <View style={[styles.boxStyle, styles.halfWidthBox]}>
              <Text style={[styles.boxText,{color:'#976f29'}]}>Difference</Text>
              <Text style={[styles.boxText, styles.boldText,{color:'#976f29'}]}>{(!price.loading && price.price) ? (DCOGprice - price.price ).toFixed(4) : "0"}</Text>
            </View>
          </View>
        </View>
        <ServerStatus  setExternalRefresh={fn => (serverStatusRef.current = fn)} refreshingParent={refreshing} ismarket={ismarket} navigation={navigation}/>
      </View>
    </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    minHeight: Dimensions.get('window').height, // Ensures full screen height
  },
  container: {
    flex: 1,
    // backgroundColor: '#023020',
    paddingHorizontal: 20,
    paddingVertical:0,
    minHeight: '100%', // Ensures container takes at least full screen height
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    // marginBottom: 20,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    gap: 20,
    // marginBottom: 20,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    // marginBottom: 10,
    gap: 10, // Added gap between boxes
  },
  logo: {
    height: 100,
    width: "70%",
    resizeMode: 'contain',
  },
  boxStyle: {
    backgroundColor: 'white',
    height: 100,
    borderRadius: 20,
    padding: 10, // Increased padding slightly
    justifyContent: 'space-between',
    flex: 1,
  },
  halfWidthBox: {
    flex: 0.5,
  },
  boxText: {
    color: '#023020', 
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600'
  },
  boldText: {
    fontWeight: 'bold',
  },
});

export default HomeScreen;