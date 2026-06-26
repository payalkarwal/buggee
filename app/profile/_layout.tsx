import { Stack } from 'expo-router';
import { useAppTheme } from '@/context/ThemeContext';

export default function ProfileLayout() {
  const { colors } = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 280,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        contentStyle: { backgroundColor: colors.bg },
      }}
    />
  );
}
