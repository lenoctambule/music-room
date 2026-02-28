import { Platform, useWindowDimensions } from 'react-native';

type Layout = 'mobile' | 'tablet' | 'desktop';

interface ResponsiveInfo {
  layout: Layout;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  contentMaxWidth: number | undefined;
  formMaxWidth: number | undefined;
}

export function useResponsive(): ResponsiveInfo {
  const { width } = useWindowDimensions();

  // On native, always mobile behavior
  if (Platform.OS !== 'web') {
    return {
      layout: 'mobile',
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      contentMaxWidth: undefined,
      formMaxWidth: undefined,
    };
  }

  if (width >= 1024) {
    return {
      layout: 'desktop',
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      contentMaxWidth: 800,
      formMaxWidth: 480,
    };
  }

  if (width >= 768) {
    return {
      layout: 'tablet',
      isMobile: false,
      isTablet: true,
      isDesktop: false,
      contentMaxWidth: 700,
      formMaxWidth: 480,
    };
  }

  return {
    layout: 'mobile',
    isMobile: true,
    isTablet: false,
    isDesktop: false,
    contentMaxWidth: undefined,
    formMaxWidth: undefined,
  };
}
