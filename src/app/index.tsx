import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useTheme } from "@/hooks/use-theme";
import { colors } from "@/styles/global";

const STORAGE_KEY = "navplate-setup";

const MACROS = [
  {
    id: "cal",
    label: "Calories",
    unit: "kcal",
    description: "Energy per meal and per day",
    color: colors.primary,
  },
  {
    id: "pro",
    label: "Protein",
    unit: "g",
    description: "Grams of protein",
    color: colors.primary,
  },
  {
    id: "carb",
    label: "Carbohydrates",
    unit: "g",
    description: "Grams of carbs",
    color: colors.primary,
  },
  {
    id: "fat",
    label: "Fat",
    unit: "g",
    description: "Grams of fat",
    color: colors.primary,
  },
  {
    id: "fib",
    label: "Fiber",
    unit: "g",
    description: "Grams of fiber",
    color: colors.primary,
  },
  {
    id: "sug",
    label: "Sugar",
    unit: "g",
    description: "Grams of sugar",
    color: colors.primary,
  },
  {
    id: "sod",
    label: "Sodium",
    unit: "mg",
    description: "Milligrams of sodium",
    color: colors.primary,
  },
] as const;

type MacroId = (typeof MACROS)[number]["id"];

type SetupState = {
  macros: Record<MacroId, boolean>;
};

type Preset = {
  id: string;
  label: string;
  macros: readonly MacroId[];
};

const PRESETS: readonly Preset[] = [
  { id: "gentle", label: "Gentle start", macros: [] },
  {
    id: "basics",
    label: "Protein, carbs, fat",
    macros: ["pro", "carb", "fat"],
  },
  {
    id: "full",
    label: "Full detail",
    macros: ["cal", "pro", "carb", "fat", "fib", "sug", "sod"],
  },
];

type Palette = {
  background: string;
  surface: string;
  raised: string;
  text: string;
  secondary: string;
  border: string;
  accent: string;
  accentText: string;
  accentSoft: string;
};

const DEFAULT_PRESET: Preset = {
  id: "default",
  label: "Default",
  macros: ["pro", "carb", "fat", "fib"],
};

function toState(preset: Preset): SetupState {
  return {
    macros: {
      cal: preset.macros.includes("cal"),
      pro: preset.macros.includes("pro"),
      carb: preset.macros.includes("carb"),
      fat: preset.macros.includes("fat"),
      fib: preset.macros.includes("fib"),
      sug: preset.macros.includes("sug"),
      sod: preset.macros.includes("sod"),
    },
  };
}

const DEFAULT_STATE = toState(DEFAULT_PRESET);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasBooleanValues<K extends string>(
  value: unknown,
  keys: readonly K[],
): value is Record<K, boolean> {
  if (!isRecord(value)) {
    return false;
  }
  return keys.every((key) => typeof value[key] === "boolean");
}

function isSetupState(value: unknown): value is SetupState {
  return (
    isRecord(value) &&
    hasBooleanValues(
      value.macros,
      MACROS.map((macro) => macro.id),
    ) 
  );
}

function sameAsPreset(state: SetupState, preset: Preset) {
  const presetState = toState(preset);
  return (
    MACROS.every(
      (macro) => state.macros[macro.id] === presetState.macros[macro.id],
    )
  );
}

function SectionHeading({
  title,
  subtitle,
  palette,
}: {
  title: string;
  subtitle: string;
  palette: Palette;
}) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={[styles.sectionTitle, { color: palette.text }]}>
        {title}
      </Text>
      <Text style={[styles.sectionSubtitle, { color: palette.secondary }]}>
        {subtitle}
      </Text>
    </View>
  );
}

function ChoiceRow({
  title,
  description,
  color,
  value,
  palette,
  disabled,
  onToggle,
}: {
  title: string;
  description: string;
  color?: string;
  value: boolean;
  palette: Palette;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={title}
      accessibilityHint={description}
      accessibilityState={{ checked: value, disabled }}
      onPress={onToggle}
      style={({ pressed }) => [
        styles.choiceRow,
        {
          borderTopColor: palette.border,
          opacity: disabled ? 0.55 : pressed ? 0.75 : 1,
        },
      ]}
    >
      {color ? (
        <View style={[styles.macroDot, { backgroundColor: color }]} />
      ) : null}
      <View style={styles.choiceText}>
        <Text style={[styles.choiceTitle, { color: palette.text }]}>
          {title}
        </Text>
        <Text style={[styles.choiceDescription, { color: palette.secondary }]}>
          {description}
        </Text>
      </View>
      <View
        style={[
          styles.switchTrack,
          { backgroundColor: value ? palette.accent : palette.border },
        ]}
      >
        <View style={[styles.switchThumb, value && styles.switchThumbOn]} />
      </View>
    </Pressable>
  );
}

function SetupSummary({
  state,
  palette,
  onEdit,
}: {
  state: SetupState;
  palette: Palette;
  onEdit: () => void;
}) {
  const selectedMacros = MACROS.filter((macro) => state.macros[macro.id]).map(
    (macro) => macro.label,
  );

  return (
    <View
      style={[
        styles.summaryCard,
        { backgroundColor: palette.surface, borderColor: palette.border },
      ]}
    >
      <Text style={[styles.eyebrow, { color: palette.accent }]}>All set</Text>
      <Text style={[styles.summaryTitle, { color: palette.text }]}>
        Your setup is saved
      </Text>
      <View style={[styles.summaryRow, { borderBottomColor: palette.border }]}>
        <Text style={[styles.summaryLabel, { color: palette.text }]}>
          Showing
        </Text>
        <Text style={[styles.summaryValue, { color: palette.secondary }]}>
          {selectedMacros.length > 0 ? selectedMacros.join(", ") : "No numbers"}
        </Text>
      </View>
      <Text style={[styles.finePrint, { color: palette.secondary }]}>
        Anything you turned off stays hidden across logs, summaries, and
        reminders. You can change this at any time from Settings.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onEdit}
        style={({ pressed }) => [
          styles.secondaryButton,
          { borderColor: palette.accent, opacity: pressed ? 0.75 : 1 },
        ]}
      >
        <Text style={[styles.secondaryButtonText, { color: palette.accent }]}>
          Change my choices
        </Text>
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const theme = useTheme();
  const palette: Palette = {
    background: theme.background,
    surface: theme.backgroundElement,
    raised: theme.backgroundSelected,
    text: theme.text,
    secondary: theme.textSecondary,
    border: colors.border,
    accent: colors.primary,
    accentText: colors.text,
    accentSoft: colors.primaryTint,
  };
  const [state, setState] = useState(DEFAULT_STATE);
  const [done, setDone] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const {
    user,
    isLoading: isUserLoading,
    createUser,
    updateUser,
  } = useCurrentUser();
  const isBusy = isLoading || isSaving || isUserLoading;

  useEffect(() => {
    let active = true;

    async function loadSavedSetup() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved !== null) {
          const parsed: unknown = JSON.parse(saved);
          if (!isSetupState(parsed)) {
            throw new Error("Saved setup data is invalid.");
          }
          if (active) {
            setState(parsed);
          }
        }
      } catch (error) {
        console.error("Unable to load the saved food tracking setup.", error);
        if (active) {
          setStorageError(
            "We couldn't load your saved setup. You can still choose and save new preferences.",
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

  const toggleMacro = (id: MacroId) => {
    setState((current) => ({
      ...current,
      macros: { ...current.macros, [id]: !current.macros[id] },
    }));
  };

  async function saveSetup() {
    const name = username.trim();
    if (!user && name === "") {
      setStorageError("Please tell us what to call you.");
      return;
    }

    setIsSaving(true);
    setStorageError(null);
    try {
      const preferences = {
        seeCalories: state.macros.cal,
        seeProtein: state.macros.pro,
        seeCarbs: state.macros.carb,
        seeFat: state.macros.fat,
        seeFiber: state.macros.fib,
        seeSugar: state.macros.sug,
        seeSodium: state.macros.sod,
      };
      // First save creates the user; later saves update their choices.
      if (user) {
        await updateUser(preferences);
      } else {
        await createUser({ username: name, ...preferences });
      }
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setDone(true);
    } catch (error) {
      console.error("Unable to save the food tracking setup.", error);
      setStorageError("We couldn't save your setup. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  const cardStyle = [
    styles.listCard,
    { backgroundColor: palette.surface, borderColor: palette.border },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentInner}>
            {done ? (
              <SetupSummary
                state={state}
                palette={palette}
                onEdit={() => setDone(false)}
              />
            ) : (
              <>
                <View style={styles.intro}>
                  <Text style={[styles.eyebrow, { color: palette.accent }]}>
                    Welcome to NavPlate
                  </Text>
                  <Text style={[styles.pageTitle, { color: palette.text }]}>
                    Choose what you want to see
                  </Text>
                  <Text
                    style={[styles.introText, { color: palette.secondary }]}
                  >
                    You decide which numbers appear. Turn off anything that is
                    not helpful right now. Hidden items stay out of your logs,
                    summaries, and reminders, and you can change your mind
                    whenever you like.
                  </Text>
                </View>

                <View style={styles.settingsColumn}>
                  {!user ? (
                    <View style={styles.section}>
                      <SectionHeading
                        title="What should we call you?"
                        subtitle="Your name or a nickname."
                        palette={palette}
                      />
                      <TextInput
                        accessibilityLabel="What should we call you?"
                        placeholder="Your name"
                        placeholderTextColor={palette.secondary}
                        value={username}
                        onChangeText={setUsername}
                        editable={!isBusy}
                        autoCapitalize="words"
                        autoCorrect={false}
                        returnKeyType="done"
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: palette.surface,
                            borderColor: palette.border,
                            color: palette.text,
                          },
                        ]}
                      />
                    </View>
                  ) : null}

                  <View style={styles.section}>
                    <SectionHeading
                      title="Start from a setup"
                      subtitle="Pick one, then adjust below."
                      palette={palette}
                    />
                    <View style={styles.presetList}>
                      {PRESETS.map((preset) => {
                        const selected = sameAsPreset(state, preset);
                        return (
                          <Pressable
                            key={preset.id}
                            disabled={isBusy}
                            accessibilityRole="button"
                            accessibilityState={{ selected, disabled: isBusy }}
                            onPress={() => setState(toState(preset))}
                            style={({ pressed }) => [
                              styles.presetButton,
                              {
                                backgroundColor: selected
                                  ? palette.accent
                                  : palette.surface,
                                borderColor: selected
                                  ? palette.accent
                                  : palette.border,
                                opacity: isBusy ? 0.55 : pressed ? 0.75 : 1,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.presetText,
                                {
                                  color: selected
                                    ? palette.accentText
                                    : palette.text,
                                },
                              ]}
                            >
                              {preset.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.section}>
                    <SectionHeading
                      title="Numbers"
                      subtitle="Each one can be on or off."
                      palette={palette}
                    />
                    <View style={cardStyle}>
                      {MACROS.map((macro) => (
                        <ChoiceRow
                          key={macro.id}
                          title={macro.label}
                          description={macro.description}
                          color={macro.color}
                          value={state.macros[macro.id]}
                          palette={palette}
                          disabled={isBusy}
                          onToggle={() => toggleMacro(macro.id)}
                        />
                      ))}
                    </View>
                  </View>

                  <View style={styles.actions}>
                    <Pressable
                      accessibilityRole="button"
                      disabled={isBusy}
                      onPress={() => void saveSetup()}
                      style={({ pressed }) => [
                        styles.primaryButton,
                        {
                          backgroundColor: palette.accent,
                          opacity: isBusy ? 0.55 : pressed ? 0.8 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.primaryButtonText,
                          { color: palette.accentText },
                        ]}
                      >
                        {isLoading
                          ? "Loading setup..."
                          : isSaving
                            ? "Saving..."
                            : "Save my setup"}
                      </Text>
                    </Pressable>
                    <Text
                      style={[styles.finePrint, { color: palette.secondary }]}
                    >
                      NavPlate supports your care plan and does not replace
                      your care team. If you work with one, they can help you
                      decide what to track.
                    </Text>
                  </View>

                  {storageError ? (
                    <Text accessibilityRole="alert" style={styles.errorText}>
                      {storageError}
                    </Text>
                  ) : null}
                </View>
              </>
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
  },
  intro: {
    gap: Spacing.two,
    marginBottom: Spacing.five,
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
  introText: {
    fontSize: 16,
    lineHeight: 24,
  },
  settingsColumn: {
    gap: Spacing.five,
  },
  section: {
    gap: Spacing.three,
  },
  sectionHeading: {
    gap: Spacing.half,
  },
  sectionTitle: {
    fontSize: 21,
    lineHeight: 28,
    fontWeight: "700",
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  presetList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  presetButton: {
    minHeight: 42,
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  presetText: {
    fontSize: 14,
    fontWeight: "600",
  },
  listCard: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  choiceRow: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  macroDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  choiceText: {
    flex: 1,
    gap: 2,
  },
  choiceTitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600",
  },
  choiceDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  switchTrack: {
    width: 50,
    height: 30,
    justifyContent: "center",
    borderRadius: 15,
    paddingHorizontal: 3,
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.text,
  },
  switchThumbOn: {
    transform: [{ translateX: 20 }],
  },
  actions: {
    gap: Spacing.two,
    alignItems: "flex-start",
  },
  primaryButton: {
    minHeight: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  finePrint: {
    fontSize: 13,
    lineHeight: 19,
  },
  summaryCard: {
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: 18,
    padding: Spacing.four,
  },
  summaryTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "700",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: Spacing.two,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  summaryValue: {
    flex: 1,
    fontSize: 14,
    textAlign: "right",
  },
  secondaryButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  errorText: {
    color: "#b42318",
    fontSize: 14,
    lineHeight: 20,
  },
});
