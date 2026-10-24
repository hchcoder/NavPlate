import { Tabs } from "expo-router";
import { Text, type ColorValue } from "react-native";

import { colors } from "@/styles/global";

const FontAwesome6 = ({
  size = 24,
  color = colors.text,
}: {
  name: string;
  size?: number;
  color?: ColorValue | null;
}) => <Text style={{ fontSize: size, color: color ?? undefined }}>🏋</Text>;

const ionIcons: Record<string, string> = {
  home: "⌂",
  "add-circle": "⊕",
  "stats-chart": "▥",
};

const Ionicons = ({
  name,
  size = 24,
  color = colors.text,
}: {
  name: string;
  size?: number;
  color?: ColorValue;
}) => <Text style={{ fontSize: size, color }}>{ionIcons[name] ?? ""}</Text>;

export default function TabLayout() {
  return (
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
          fontWeight: "600",
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="startworkout"
        options={{
          title: "Start Workout",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: "Workouts",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome6 name="dumbbell" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: "Statistics",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
