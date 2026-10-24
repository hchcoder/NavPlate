import { DarkTheme, Tabs, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { colors } from "@/styles/global";

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  return (
    <ThemeProvider value={DarkTheme}>
      <AnimatedSplashOverlay />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.header,
            borderTopColor: colors.border,
            borderTopWidth: 1,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Setup",
          }}
        />
        <Tabs.Screen
          name="daily"
          options={{
            title: "Daily View",
          }}
        />
        <Tabs.Screen
          name="meals"
          options={{
            title: "Add Meal",
          }}
        />
      </Tabs>
    </ThemeProvider>
  );
}
