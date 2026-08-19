import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTranslation } from '@/contexts/TranslationContext';
import { styles } from "@/styles/app/+not-found.styles";

export default function NotFoundScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('oops') }} />
      <ThemedView style={styles.container}>
        <ThemedText type="title">{t('screenNotExist')}</ThemedText>
        <Link href="/" style={styles.link}>
          <ThemedText type="link">{t('goToHomeScreen')}</ThemedText>
        </Link>
      </ThemedView>
    </>
  );
}
