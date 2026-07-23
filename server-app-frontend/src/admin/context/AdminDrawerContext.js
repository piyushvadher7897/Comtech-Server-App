import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

const AdminDrawerContext = createContext(null);

export const AdminDrawerProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const navigationRef = useRef(null);

  const openDrawer = useCallback(() => setOpen(true), []);
  const closeDrawer = useCallback(() => setOpen(false), []);
  const toggleDrawer = useCallback(() => setOpen(prev => !prev), []);

  const registerNavigation = useCallback(navigation => {
    if (navigation) {
      navigationRef.current = navigation;
    }
  }, []);

  const getNavigation = useCallback(() => navigationRef.current, []);

  const value = useMemo(
    () => ({
      open,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      registerNavigation,
      getNavigation,
    }),
    [open, openDrawer, closeDrawer, toggleDrawer, registerNavigation, getNavigation],
  );

  return (
    <AdminDrawerContext.Provider value={value}>{children}</AdminDrawerContext.Provider>
  );
};

export const useAdminDrawer = () => {
  const ctx = useContext(AdminDrawerContext);
  if (!ctx) {
    return {
      open: false,
      openDrawer: () => {},
      closeDrawer: () => {},
      toggleDrawer: () => {},
      registerNavigation: () => {},
      getNavigation: () => null,
    };
  }
  return ctx;
};

/** Call from any logged-in admin screen so the side drawer can navigate. */
export const useRegisterAdminNavigation = navigation => {
  const { registerNavigation } = useAdminDrawer();
  useEffect(() => {
    registerNavigation(navigation);
  }, [navigation, registerNavigation]);
};
