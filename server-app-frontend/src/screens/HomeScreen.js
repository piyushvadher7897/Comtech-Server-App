import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ImageBackground,
  RefreshControl,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ServerStatus from '../screens/ServerStatus';
import { APP_URL } from '../global/constant';
import { io } from 'socket.io-client';
import GoldCard, { GoldLabel, GoldMeta, GoldValue } from '../components/GoldCard';
import { GoldBarsIcon, BalanceScaleIcon, PriceIconBadge } from '../components/PriceIcons';
import { colors, cardShadow } from '../theme/theme';
import {
  getDisplayDifference,
  getDisplayPrice,
  getShownDifferenceText,
  isValidDisplayPrice,
  pickPriceUpdatedAt,
  formatPriceUpdatedLabel,
} from '../utils/priceDisplay';

const socket = io(APP_URL);

const DifferenceCard = ({ value, variant }) => {
  const isLoading = variant === 'loading';
  const isUnavailable = variant === 'unavailable';

  return (
    <View style={styles.diffSection}>
      <View style={styles.diffCardOuter}>
        <View style={styles.diffRibbon}>
          <Text style={styles.diffRibbonText}>DIFFERENCE</Text>
        </View>
        <View style={styles.diffCardInner}>
          <Text
            style={[
              styles.diffAmount,
              isLoading && styles.diffAmountLoading,
              isUnavailable && styles.diffAmountUnavailable,
              variant === 'stale' && styles.diffAmountStale,
            ]}>
            {value}
          </Text>
        </View>
      </View>
    </View>
  );
};

const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [price, setPrice] = useState({ loading: true, price: 0 });
  const [ismarket, setIsMarket] = useState(false);
  const [DCOGprice, setDCOGPrice] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [priceUpdatedAt, setPriceUpdatedAt] = useState(null);
  const serverStatusRef = useRef();
  const lastValidStoneX = useRef(null);
  const lastValidDgjg = useRef(null);

  const onRefresh = () => {
    setRefreshing(true);
    socket.emit('getprice');
    if (serverStatusRef.current) {
      serverStatusRef.current();
    }
    setTimeout(() => setRefreshing(false), 2000);
  };

  useEffect(() => {
    socket.emit('getprice');
    const updatePrice = data => {
      setIsMarket(data.isMarket);
      setPrice({ price: data.stonexprice * 3.675, loading: false });
      setDCOGPrice(data.goldRate);
      setPriceUpdatedAt(pickPriceUpdatedAt(data));
      setRefreshing(false);
    };
    socket.on('getpriceUpdate', updatePrice);
    return () => socket.off('getpriceUpdate', updatePrice);
  }, []);

  if (isValidDisplayPrice(price.price)) {
    lastValidStoneX.current = price.price;
  }
  if (isValidDisplayPrice(DCOGprice)) {
    lastValidDgjg.current = DCOGprice;
  }

  const stoneXDisplay = getDisplayPrice(price.price, {
    loading: price.loading,
    refreshing,
    lastValid: lastValidStoneX.current,
  });
  const dgjgDisplay = getDisplayPrice(DCOGprice, {
    loading: price.loading,
    refreshing,
    lastValid: lastValidDgjg.current,
  });
  const diffDisplay = getDisplayDifference(price.price, DCOGprice, {
    loading: price.loading,
    refreshing,
    lastStoneX: lastValidStoneX.current,
    lastDgjg: lastValidDgjg.current,
  });

  const differenceText = getShownDifferenceText({
    stoneXDisplayText: stoneXDisplay.text,
    dgjgDisplayText: dgjgDisplay.text,
    stoneX: price.price,
    dgjg: DCOGprice,
    lastStoneX: lastValidStoneX.current,
    lastDgjg: lastValidDgjg.current,
    fallback: diffDisplay.text,
  });

  const showPriceHint =
    (refreshing || price.loading) && differenceText === '···';
  const updatedLabel = formatPriceUpdatedLabel(priceUpdatedAt);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ImageBackground
        source={require('../../asset/images/bg-img.png')}
        style={styles.backgroundImage}
        resizeMode="cover">
        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.gold}
              colors={[colors.gold]}
            />
          }>
          <View style={styles.container}>
            <View style={styles.logoContainer}>
              <Image
                style={styles.logo}
                source={require('../../asset/images/logo-white.png')}
              />
            </View>

            <View style={styles.contentContainer}>
              {showPriceHint ? (
                <Text style={styles.priceHint}>Updating live prices…</Text>
              ) : null}

              <View style={styles.rowContainer}>
                <GoldCard
                  centered
                  style={[
                    styles.priceCard,
                    stoneXDisplay.variant === 'unavailable' && styles.priceCardMuted,
                  ]}>
                  <PriceIconBadge>
                    <GoldBarsIcon size={22} />
                  </PriceIconBadge>
                  <GoldLabel centered light>
                    StoneX Gold Price (24K)
                  </GoldLabel>
                  <GoldValue centered light large variant={stoneXDisplay.variant}>
                    {stoneXDisplay.text}
                  </GoldValue>
                  {updatedLabel ? (
                    <GoldMeta centered>{updatedLabel}</GoldMeta>
                  ) : null}
                </GoldCard>

                <GoldCard
                  centered
                  style={[
                    styles.priceCard,
                    dgjgDisplay.variant === 'unavailable' && styles.priceCardMuted,
                  ]}>
                  <PriceIconBadge>
                    <BalanceScaleIcon size={22} />
                  </PriceIconBadge>
                  <GoldLabel centered light>
                    DGJG Gold Price (24K)
                  </GoldLabel>
                  <GoldValue centered light large variant={dgjgDisplay.variant}>
                    {dgjgDisplay.text}
                  </GoldValue>
                  {updatedLabel ? (
                    <GoldMeta centered>{updatedLabel}</GoldMeta>
                  ) : null}
                </GoldCard>
              </View>

              <DifferenceCard value={differenceText} variant={diffDisplay.variant} />
            </View>

            <ServerStatus
              setExternalRefresh={fn => (serverStatusRef.current = fn)}
              refreshingParent={refreshing}
              ismarket={ismarket}
              navigation={navigation}
            />

            <View style={styles.footer}>
              <View style={styles.footerLeft}>
                <Text style={styles.footerShield}>🛡</Text>
                <Text style={styles.footerSecure}>
                  All systems secure and monitored.
                </Text>
              </View>
              <Text style={styles.footerThanks}>
                Thank you for trusting ComTech Gold.
              </Text>
            </View>
          </View>
        </ScrollView>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    minHeight: Dimensions.get('window').height,
  },
  scrollContainer: {
    flexGrow: 1,
    minHeight: Dimensions.get('window').height,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  logo: {
    height: 88,
    width: '72%',
    resizeMode: 'contain',
  },
  contentContainer: {
    gap: 16,
    marginBottom: 12,
    zIndex: 2,
  },
  priceHint: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: -8,
  },
  priceCardMuted: {
    opacity: 0.88,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  priceCard: {
    flex: 1,
    minHeight: 130,
    paddingVertical: 16,
    paddingHorizontal: 10,
    justifyContent: 'flex-start',
  },
  diffSection: {
    width: '100%',
    marginTop: 10,
    marginBottom: 4,
    zIndex: 5,
    elevation: 5,
  },
  diffCardOuter: {
    width: '100%',
    alignItems: 'center',
    overflow: 'visible',
  },
  diffCardInner: {
    width: '100%',
    minHeight: 92,
    paddingTop: 28,
    paddingBottom: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    ...cardShadow,
  },
  diffRibbon: {
    position: 'absolute',
    top: 0,
    zIndex: 10,
    backgroundColor: colors.gold,
    borderWidth: 1,
    borderColor: '#F0D78C',
    borderRadius: 6,
    paddingHorizontal: 24,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 6,
  },
  diffRibbonText: {
    color: '#1a1208',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  diffAmount: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  diffAmountLoading: {
    color: colors.textMuted,
    fontSize: 28,
    letterSpacing: 4,
  },
  diffAmountUnavailable: {
    color: colors.textDim,
    fontSize: 28,
  },
  diffAmountStale: {
    opacity: 0.8,
  },
  footer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.goldBorder,
    paddingTop: 14,
    paddingBottom: 4,
    gap: 8,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerShield: {
    fontSize: 14,
    color: colors.gold,
  },
  footerSecure: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  footerThanks: {
    color: colors.goldMuted,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
  },
});

export default HomeScreen;
