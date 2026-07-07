/**
 * Navigate from nested tab screens to stack screens (TakeAction, DepositDetail, etc.).
 * AdminApprovals lives under AdminTabs → AdminStack, so we walk up the tree
 * until we find a navigator that owns the target screen.
 */
export const navigateToAdminScreen = (navigation, screenName, params = {}) => {
  let nav = navigation;
  while (nav) {
    const routeNames = nav.getState?.()?.routeNames;
    if (Array.isArray(routeNames) && routeNames.includes(screenName)) {
      nav.navigate(screenName, params);
      return;
    }
    nav = nav.getParent?.();
  }
  navigation.navigate(screenName, params);
};

/**
 * Navigate to the Profile tab from any admin screen (tabs or stack).
 */
export const navigateToAdminProfile = navigation => {
  let nav = navigation;
  while (nav) {
    const routeNames = nav.getState?.()?.routeNames;
    if (Array.isArray(routeNames) && routeNames.includes('AdminProfile')) {
      nav.navigate('AdminProfile');
      return;
    }
    if (Array.isArray(routeNames) && routeNames.includes('AdminTabs')) {
      nav.navigate('AdminTabs', { screen: 'AdminProfile' });
      return;
    }
    nav = nav.getParent?.();
  }
  navigation.navigate('AdminTabs', { screen: 'AdminProfile' });
};

/**
 * Clear approval flow screens and land on the dashboard tab.
 * Prevents system back from walking through TakeAction / DepositDetail again.
 */
export const resetToAdminDashboard = navigation => {
  let nav = navigation;
  while (nav) {
    const routeNames = nav.getState?.()?.routeNames;
    if (Array.isArray(routeNames) && routeNames.includes('AdminTabs')) {
      nav.reset({
        index: 0,
        routes: [
          {
            name: 'AdminTabs',
            state: {
              index: 0,
              routes: [{ name: 'AdminDashboard' }],
            },
          },
        ],
      });
      return;
    }
    nav = nav.getParent?.();
  }

  navigation.reset({
    index: 0,
    routes: [
      {
        name: 'AdminTabs',
        state: {
          index: 0,
          routes: [{ name: 'AdminDashboard' }],
        },
      },
    ],
  });
};
