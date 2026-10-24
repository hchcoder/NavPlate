import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  DailyPreview,
  DEFAULT_STATE,
  isSetupState,
  type SetupState,
} from "@/components/daily-preview";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const STORAGE_KEY = "steady-plate-setup";

export default function DailyScreen() {
  const theme = useTheme();
  const palette = {
    background: theme.background,
    surface: theme.backgroundElement,
    raised: theme.backgroundSelected,
    text: theme.text,
    secondary: theme.textSecondary,
    border: theme.textSecondary + "55",
    accent: "#2b7a74",
    accentText: "#ffffff",
    accentSoft: "#d3ebe8",
  };
  const [state, setState] = useState<SetupState>(DEFAULT_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSavedSetup() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (!active) {
          return;
        }

        if (saved !== null) {
          const parsed: unknown = JSON.parse(saved);
          if (!isSetupState(parsed)) {
            throw new Error("Saved setup data is invalid.");
          }
          setState(parsed);
        }
      } catch (error) {
        console.error("Unable to load the saved food tracking setup.", error);
        if (active) {
          setStorageError(
            "We couldn't load your saved setup. You can still choose and save new preferences on the Setup tab.",
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadSavedSetup();
    return () => {
      active = false;
    };
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentInner}>
            <View style={styles.header}>
              <Text style={[styles.eyebrow, { color: palette.accent }]}>Daily view</Text>
              <Text style={[styles.pageTitle, { color: palette.text }]}>
                Today at a glance
              </Text>
            </View>

            {storageError ? (
              <Text accessibilityRole="alert" style={styles.errorText}>
                {storageError}
              </Text>
            ) : null}

            {!isLoading ? (
              <DailyPreview state={state} palette={palette} />
            ) : (
              <Text style={[styles.loadingText, { color: palette.secondary }]}>
                Loading your setup...
              </Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  contentInner: {
    width: "100%",
    maxWidth: MaxContentWidth,
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.one,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  pageTitle: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "700",
  },
  loadingText: {
    fontSize: 16,
    lineHeight: 24,
  },
  errorText: {
    color: "#b42318",
    fontSize: 14,
    lineHeight: 20,
  },
});
