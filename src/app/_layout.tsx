import { DarkTheme, Tabs, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { CurrentUserProvider } from "@/hooks/use-current-user";
import { colors } from "@/styles/global";
import { Ionicons } from '@expo/vector-icons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';


SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  return (
    <CurrentUserProvider>
    <ThemeProvider value={DarkTheme}>
      <AnimatedSplashOverlay />
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.header,
          borderTopColor: colors.primary,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.primaryBright,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
      }}
    >
        <Tabs.Screen
          name="index"
          options={{
            title: "Setup",
             tabBarIcon: ({ color, size }) => (
            <Ionicons name='toggle' size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="daily"
          options={{
            title: "Daily View",
            tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name='food-fork-drink' size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="meals"
          options={{
            title: "Add Meal",
            tabBarIcon: ({ color, size }) => (
            <FontAwesome6 name='bowl-food' size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </ThemeProvider>
    </CurrentUserProvider>
  );
}
