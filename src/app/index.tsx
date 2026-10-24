import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const MACROS = [
  { id: "cal", label: "Calories", unit: "kcal", description: "Energy per meal and per day", color: "#b5651d" },
  { id: "pro", label: "Protein", unit: "g", description: "Grams of protein", color: "#3c6fb0" },
  { id: "carb", label: "Carbohydrates", unit: "g", description: "Grams of carbs", color: "#8a5fb3" },
  { id: "fat", label: "Fat", unit: "g", description: "Grams of fat", color: "#b8902a" },
  { id: "fib", label: "Fiber", unit: "g", description: "Grams of fiber", color: "#3f8a56" },
  { id: "sug", label: "Sugar", unit: "g", description: "Grams of sugar", color: "#c2547a" },
  { id: "sod", label: "Sodium", unit: "mg", description: "Milligrams of sodium", color: "#5f7480" },
] as const;

const OPTIONS = [
  { id: "totals", label: "Daily totals", description: "Add up each macro you have turned on" },
  { id: "reveal", label: "Hide numbers until I tap", description: "Tap a number to reveal it in the preview" },
  { id: "checkin", label: "Meal check-ins", description: "A quick, optional note on how a meal felt" },
  { id: "streaks", label: "Logging streaks", description: "Count of days in a row you logged" },
  { id: "weight", label: "Body weight entry", description: "A weight field on the daily view" },
] as const;

type MacroId = (typeof MACROS)[number]["id"];
type OptionId = (typeof OPTIONS)[number]["id"];
type SetupState = {
  macros: Record<MacroId, boolean>;
  opts: Record<OptionId, boolean>;
};
type Preset = {
  id: string;
  label: string;
  macros: readonly MacroId[];
  opts: readonly OptionId[];
};

const PRESETS: readonly Preset[] = [
  { id: "gentle", label: "Gentle start", macros: [], opts: ["checkin"] },
  { id: "basics", label: "Protein, carbs, fat", macros: ["pro", "carb", "fat"], opts: ["checkin", "reveal"] },
  {
    id: "full",
    label: "Full detail",
    macros: ["cal", "pro", "carb", "fat", "fib", "sug", "sod"],
    opts: ["totals"],
  },
];

const MEALS: readonly {
  name: string;
  time: string;
  values: Record<MacroId, number>;
}[] = [
  {
    name: "Oatmeal, banana, peanut butter",
    time: "8:10 AM",
    values: { cal: 420, pro: 14, carb: 62, fat: 13, fib: 8, sug: 14, sod: 180 },
  },
  {
    name: "Chicken and rice bowl",
    time: "12:40 PM",
    values: { cal: 560, pro: 36, carb: 68, fat: 14, fib: 6, sug: 5, sod: 640 },
  },
  {
    name: "Yogurt with berries",
    time: "3:30 PM",
    values: { cal: 180, pro: 12, carb: 22, fat: 4, fib: 3, sug: 16, sod: 70 },
  },
  {
    name: "Vegetable pasta",
    time: "7:00 PM",
    values: { cal: 610, pro: 20, carb: 92, fat: 17, fib: 9, sug: 10, sod: 720 },
  },
];

const MOODS = ["Satisfying", "Okay", "Hard"] as const;
const STORAGE_KEY = "steady-plate-setup";
const DEFAULT_PRESET: Preset = {
  id: "default",
  label: "Default",
  macros: ["pro", "carb", "fat", "fib"],
  opts: ["checkin"],
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
    opts: {
      totals: preset.opts.includes("totals"),
      reveal: preset.opts.includes("reveal"),
      checkin: preset.opts.includes("checkin"),
      streaks: preset.opts.includes("streaks"),
      weight: preset.opts.includes("weight"),
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
    hasBooleanValues(value.macros, MACROS.map((macro) => macro.id)) &&
    hasBooleanValues(value.opts, OPTIONS.map((option) => option.id))
  );
}

function sameAsPreset(state: SetupState, preset: Preset) {
  const presetState = toState(preset);
  return (
    MACROS.every((macro) => state.macros[macro.id] === presetState.macros[macro.id]) &&
    OPTIONS.every((option) => state.opts[option.id] === presetState.opts[option.id])
  );
}

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
      <Text style={[styles.sectionTitle, { color: palette.text }]}>{title}</Text>
      <Text style={[styles.sectionSubtitle, { color: palette.secondary }]}>{subtitle}</Text>
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
        { borderTopColor: palette.border, opacity: disabled ? 0.55 : pressed ? 0.75 : 1 },
      ]}>
      {color ? <View style={[styles.macroDot, { backgroundColor: color }]} /> : null}
      <View style={styles.choiceText}>
        <Text style={[styles.choiceTitle, { color: palette.text }]}>{title}</Text>
        <Text style={[styles.choiceDescription, { color: palette.secondary }]}>{description}</Text>
      </View>
      <View
        style={[
          styles.switchTrack,
          { backgroundColor: value ? palette.accent : palette.border },
        ]}>
        <View
          style={[
            styles.switchThumb,
            value && styles.switchThumbOn,
          ]}
        />
      </View>
    </Pressable>
  );
}

function MacroChip({
  macro,
  value,
  reveal,
  palette,
}: {
  macro: (typeof MACROS)[number];
  value: number;
  reveal: boolean;
  palette: Palette;
}) {
  const [shown, setShown] = useState(false);
  const hidden = reveal && !shown;
  const label = hidden
    ? `${macro.label} hidden, tap to show`
    : `${macro.label}, ${value} ${macro.unit}`;

  const content = (
    <>
      <View style={[styles.chipDot, { backgroundColor: macro.color }]} />
      <Text style={[styles.chipLabel, { color: palette.text }]}>{macro.label}</Text>
      <Text style={[styles.chipValue, { color: palette.text }]}>
        {hidden ? "Tap to reveal" : `${value} ${macro.unit}`}
      </Text>
    </>
  );

  if (!reveal) {
    return (
      <View
        accessibilityLabel={label}
        style={[styles.macroChip, { backgroundColor: palette.background }]}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => setShown((current) => !current)}
      style={({ pressed }) => [
        styles.macroChip,
        { backgroundColor: palette.background, opacity: pressed ? 0.75 : 1 },
      ]}>
      {content}
    </Pressable>
  );
}

function MealCard({
  meal,
  state,
  palette,
}: {
  meal: (typeof MEALS)[number];
  state: SetupState;
  palette: Palette;
}) {
  const [mood, setMood] = useState<(typeof MOODS)[number] | null>(null);
  const visibleMacros = MACROS.filter((macro) => state.macros[macro.id]);

  return (
    <View style={[styles.mealCard, { backgroundColor: palette.raised }]}>
      <View style={styles.mealHeader}>
        <Text style={[styles.mealName, { color: palette.text }]}>{meal.name}</Text>
        <Text style={[styles.mealTime, { color: palette.secondary }]}>{meal.time}</Text>
      </View>
      {visibleMacros.length > 0 ? (
        <View style={styles.chipList}>
          {visibleMacros.map((macro) => (
            <MacroChip
              key={macro.id}
              macro={macro}
              value={meal.values[macro.id]}
              reveal={state.opts.reveal}
              palette={palette}
            />
          ))}
        </View>
      ) : null}
      {state.opts.checkin ? (
        <View style={styles.checkin}>
          <Text style={[styles.checkinLabel, { color: palette.secondary }]}>How did it feel?</Text>
          {MOODS.map((item) => {
            const selected = mood === item;
            return (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setMood(selected ? null : item)}
                style={({ pressed }) => [
                  styles.moodButton,
                  {
                    backgroundColor: selected ? palette.accentSoft : palette.surface,
                    borderColor: selected ? palette.accent : palette.border,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}>
                <Text style={[styles.moodText, { color: selected ? palette.accent : palette.text }]}>
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function DailyPreview({ state, palette }: { state: SetupState; palette: Palette }) {
  const visibleMacros = MACROS.filter((macro) => state.macros[macro.id]);
  const hasVisibleNumbers = visibleMacros.length > 0;

  return (
    <View style={styles.preview}>
      <Text style={[styles.eyebrow, { color: palette.secondary }]}>Your daily view</Text>
      <View
        style={[
          styles.previewCard,
          { backgroundColor: palette.surface, borderColor: palette.border },
        ]}>
        <View style={styles.previewHeader}>
          <Text style={[styles.previewTitle, { color: palette.text }]}>Today</Text>
          {state.opts.streaks ? (
            <View style={[styles.streakPill, { backgroundColor: palette.accentSoft }]}>
              <Text style={[styles.streakText, { color: palette.accent }]}>5 days logged</Text>
            </View>
          ) : null}
        </View>

        {MEALS.map((meal) => (
          <MealCard key={meal.name} meal={meal} state={state} palette={palette} />
        ))}

        {!hasVisibleNumbers ? (
          <Text style={[styles.previewMessage, { color: palette.secondary }]}>
            No numbers are showing. You see what you ate and when.
          </Text>
        ) : null}

        {state.opts.totals && hasVisibleNumbers ? (
          <View style={[styles.totals, { borderTopColor: palette.border }]}>
            <Text style={[styles.eyebrow, { color: palette.secondary }]}>Day so far</Text>
            <View style={styles.chipList}>
              {visibleMacros.map((macro) => {
                const total = MEALS.reduce((sum, meal) => sum + meal.values[macro.id], 0);
                return (
                  <MacroChip
                    key={macro.id}
                    macro={macro}
                    value={total}
                    reveal={state.opts.reveal}
                    palette={palette}
                  />
                );
              })}
            </View>
          </View>
        ) : null}

        {state.opts.weight ? (
          <View style={[styles.weightRow, { borderTopColor: palette.border }]}>
            <Text style={[styles.weightText, { color: palette.secondary }]}>Body weight</Text>
            <Text style={[styles.weightText, { color: palette.accent }]}>Add entry</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.previewNote, { color: palette.secondary }]}>
        These are sample meals to preview your choices. This is not your personal data.
      </Text>
    </View>
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
  const selectedMacros = MACROS.filter((macro) => state.macros[macro.id]).map((macro) => macro.label);
  const selectedOptions = OPTIONS.filter((option) => state.opts[option.id]).map((option) => option.label);

  return (
    <View
      style={[
        styles.summaryCard,
        { backgroundColor: palette.surface, borderColor: palette.border },
      ]}>
      <Text style={[styles.eyebrow, { color: palette.accent }]}>All set</Text>
      <Text style={[styles.summaryTitle, { color: palette.text }]}>Your setup is saved</Text>
      <View style={[styles.summaryRow, { borderBottomColor: palette.border }]}>
        <Text style={[styles.summaryLabel, { color: palette.text }]}>Showing</Text>
        <Text style={[styles.summaryValue, { color: palette.secondary }]}>
          {selectedMacros.length > 0 ? selectedMacros.join(", ") : "No numbers"}
        </Text>
      </View>
      <View style={[styles.summaryRow, { borderBottomColor: palette.border }]}>
        <Text style={[styles.summaryLabel, { color: palette.text }]}>Options</Text>
        <Text style={[styles.summaryValue, { color: palette.secondary }]}>
          {selectedOptions.length > 0 ? selectedOptions.join(", ") : "None"}
        </Text>
      </View>
      <Text style={[styles.finePrint, { color: palette.secondary }]}>
        Anything you turned off stays hidden across logs, summaries, and reminders. You can change this at any time
        from Settings.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onEdit}
        style={({ pressed }) => [
          styles.secondaryButton,
          { borderColor: palette.accent, opacity: pressed ? 0.75 : 1 },
        ]}>
        <Text style={[styles.secondaryButtonText, { color: palette.accent }]}>Change my choices</Text>
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
    border: theme.textSecondary + "55",
    accent: "#2b7a74",
    accentText: "#ffffff",
    accentSoft: "#d3ebe8",
  };
  const [state, setState] = useState(DEFAULT_STATE);
  const [done, setDone] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const isBusy = isLoading || isSaving;

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
          setStorageError("We couldn't load your saved setup. You can still choose and save new preferences.");
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

  const toggleOption = (id: OptionId) => {
    setState((current) => ({
      ...current,
      opts: { ...current.opts, [id]: !current.opts[id] },
    }));
  };

  async function saveSetup() {
    setIsSaving(true);
    setStorageError(null);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setDone(true);
    } catch (error) {
      console.error("Unable to save the food tracking setup.", error);
      setStorageError("We couldn't save your setup. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  const cardStyle = [styles.listCard, { backgroundColor: palette.surface, borderColor: palette.border }];

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <View style={styles.contentInner}>
            {done ? (
              <SetupSummary state={state} palette={palette} onEdit={() => setDone(false)} />
            ) : (
              <>
                <View style={styles.intro}>
                  <Text style={[styles.eyebrow, { color: palette.accent }]}>Welcome to Steady Plate</Text>
                  <Text style={[styles.pageTitle, { color: palette.text }]}>Choose what you want to see</Text>
                  <Text style={[styles.introText, { color: palette.secondary }]}>
                    You decide which numbers appear. Turn off anything that is not helpful right now. Hidden items
                    stay out of your logs, summaries, and reminders, and you can change your mind whenever you like.
                  </Text>
                </View>

                <View style={styles.settingsColumn}>
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
                                backgroundColor: selected ? palette.accent : palette.surface,
                                borderColor: selected ? palette.accent : palette.border,
                                opacity: isBusy ? 0.55 : pressed ? 0.75 : 1,
                              },
                            ]}>
                            <Text
                              style={[
                                styles.presetText,
                                { color: selected ? palette.accentText : palette.text },
                              ]}>
                              {preset.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.section}>
                    <SectionHeading title="Numbers" subtitle="Each one can be on or off." palette={palette} />
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

                  <View style={styles.section}>
                    <SectionHeading
                      title="How it looks"
                      subtitle="Small choices that change how the daily view feels."
                      palette={palette}
                    />
                    <View style={cardStyle}>
                      {OPTIONS.map((option) => (
                        <ChoiceRow
                          key={option.id}
                          title={option.label}
                          description={option.description}
                          value={state.opts[option.id]}
                          palette={palette}
                          disabled={isBusy}
                          onToggle={() => toggleOption(option.id)}
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
                      ]}>
                      <Text style={[styles.primaryButtonText, { color: palette.accentText }]}>
                        {isLoading ? "Loading setup..." : isSaving ? "Saving..." : "Save my setup"}
                      </Text>
                    </Pressable>
                    <Text style={[styles.finePrint, { color: palette.secondary }]}>
                      Steady Plate supports your care plan and does not replace your care team. If you work with one,
                      they can help you decide what to track.
                    </Text>
                  </View>

                  {storageError ? (
                    <Text accessibilityRole="alert" style={styles.errorText}>
                      {storageError}
                    </Text>
                  ) : null}

                  <DailyPreview state={state} palette={palette} />
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
    backgroundColor: "#ffffff",
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
  preview: {
    gap: Spacing.two,
  },
  previewCard: {
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: 22,
    padding: Spacing.three,
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  streakPill: {
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  streakText: {
    fontSize: 12,
    fontWeight: "700",
  },
  mealCard: {
    gap: Spacing.two,
    borderRadius: 14,
    padding: Spacing.three,
  },
  mealHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  mealName: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600",
  },
  mealTime: {
    fontSize: 12,
    lineHeight: 18,
  },
  chipList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.one,
  },
  macroChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  chipDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  chipLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  chipValue: {
    fontSize: 11,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  checkin: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing.one,
  },
  checkinLabel: {
    fontSize: 12,
    marginRight: 2,
  },
  moodButton: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  moodText: {
    fontSize: 12,
    fontWeight: "500",
  },
  previewMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  totals: {
    gap: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.three,
  },
  weightRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.three,
  },
  weightText: {
    fontSize: 14,
    fontWeight: "600",
  },
  previewNote: {
    fontSize: 12,
    lineHeight: 18,
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
