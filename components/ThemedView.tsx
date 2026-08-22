import { View } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

import type { ThemedViewProps } from '@/types/components/ThemedView.types';

export type { ThemedViewProps };

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
