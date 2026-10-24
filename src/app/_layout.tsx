import { DarkTheme, DefaultTheme, Tabs, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colorScheme === "dark" ? "#111827" : "#ffffff",
            borderTopColor: colorScheme === "dark" ? "#374151" : "#e5e7eb",
            borderTopWidth: 1,
          },
          tabBarActiveTintColor: "#2b7a74",
          tabBarInactiveTintColor: colorScheme === "dark" ? "#9ca3af" : "#64748b",
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
          name="meal"
          options={{
            title: "Add Meal",
          }}
        />
      </Tabs>
    </ThemeProvider>
  );
}
