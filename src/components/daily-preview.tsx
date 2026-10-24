import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Spacing } from "@/constants/theme";

export const MACROS = [
  {
    id: "cal",
    label: "Calories",
    unit: "kcal",
    description: "Energy per meal and per day",
    color: "#b5651d",
  },
  {
    id: "pro",
    label: "Protein",
    unit: "g",
    description: "Grams of protein",
    color: "#3c6fb0",
  },
  {
    id: "carb",
    label: "Carbohydrates",
    unit: "g",
    description: "Grams of carbs",
    color: "#8a5fb3",
  },
  {
    id: "fat",
    label: "Fat",
    unit: "g",
    description: "Grams of fat",
    color: "#b8902a",
  },
  {
    id: "fib",
    label: "Fiber",
    unit: "g",
    description: "Grams of fiber",
    color: "#3f8a56",
  },
  {
    id: "sug",
    label: "Sugar",
    unit: "g",
    description: "Grams of sugar",
    color: "#c2547a",
  },
  {
    id: "sod",
    label: "Sodium",
    unit: "mg",
    description: "Milligrams of sodium",
    color: "#5f7480",
  },
] as const;

export const OPTIONS = [
  {
    id: "totals",
    label: "Daily totals",
    description: "Add up each macro you have turned on",
  },
  {
    id: "reveal",
    label: "Hide numbers until I tap",
    description: "Tap a number to reveal it in the preview",
  },
  {
    id: "checkin",
    label: "Meal check-ins",
    description: "A quick, optional note on how a meal felt",
  },
  {
    id: "streaks",
    label: "Logging streaks",
    description: "Count of days in a row you logged",
  },
  {
    id: "weight",
    label: "Body weight entry",
    description: "A weight field on the daily view",
  },
] as const;

export type MacroId = (typeof MACROS)[number]["id"];
export type OptionId = (typeof OPTIONS)[number]["id"];

export type SetupState = {
  macros: Record<MacroId, boolean>;
  opts: Record<OptionId, boolean>;
};

export type Preset = {
  id: string;
  label: string;
  macros: readonly MacroId[];
  opts: readonly OptionId[];
};

export const PRESETS: readonly Preset[] = [
  { id: "gentle", label: "Gentle start", macros: [], opts: ["checkin"] },
  {
    id: "basics",
    label: "Protein, carbs, fat",
    macros: ["pro", "carb", "fat"],
    opts: ["checkin", "reveal"],
  },
  {
    id: "full",
    label: "Full detail",
    macros: ["cal", "pro", "carb", "fat", "fib", "sug", "sod"],
    opts: ["totals"],
  },
];

export const MEALS: readonly {
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

export const MOODS = ["Satisfying", "Okay", "Hard"] as const;

export type Palette = {
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

export const DEFAULT_PRESET: Preset = {
  id: "default",
  label: "Default",
  macros: ["pro", "carb", "fat", "fib"],
  opts: ["checkin"],
};

export function toState(preset: Preset): SetupState {
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

export const DEFAULT_STATE = toState(DEFAULT_PRESET);

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

export function isSetupState(value: unknown): value is SetupState {
  return (
    isRecord(value) &&
    hasBooleanValues(
      value.macros,
      MACROS.map((macro) => macro.id),
    ) &&
    hasBooleanValues(
      value.opts,
      OPTIONS.map((option) => option.id),
    )
  );
}

export function sameAsPreset(state: SetupState, preset: Preset) {
  const presetState = toState(preset);
  return (
    MACROS.every(
      (macro) => state.macros[macro.id] === presetState.macros[macro.id],
    ) &&
    OPTIONS.every(
      (option) => state.opts[option.id] === presetState.opts[option.id],
    )
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
      <Text style={[styles.chipLabel, { color: palette.text }]}>
        {macro.label}
      </Text>
      <Text style={[styles.chipValue, { color: palette.text }]}>
        {hidden ? "Tap to reveal" : `${value} ${macro.unit}`}
      </Text>
    </>
  );

  if (!reveal) {
    return (
      <View
        accessibilityLabel={label}
        style={[styles.macroChip, { backgroundColor: palette.background }]}
      >
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
      ]}
    >
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
        <Text style={[styles.mealName, { color: palette.text }]}>
          {meal.name}
        </Text>
        <Text style={[styles.mealTime, { color: palette.secondary }]}>
          {meal.time}
        </Text>
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
          <Text style={[styles.checkinLabel, { color: palette.secondary }]}>
            How did it feel?
          </Text>
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
                    backgroundColor: selected
                      ? palette.accentSoft
                      : palette.surface,
                    borderColor: selected ? palette.accent : palette.border,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.moodText,
                    { color: selected ? palette.accent : palette.text },
                  ]}
                >
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

export function DailyPreview({
  state,
  palette,
}: {
  state: SetupState;
  palette: Palette;
}) {
  const visibleMacros = MACROS.filter((macro) => state.macros[macro.id]);
  const hasVisibleNumbers = visibleMacros.length > 0;

  return (
    <View style={styles.preview}>
      <Text style={[styles.eyebrow, { color: palette.secondary }]}>
        Your daily view
      </Text>
      <View
        style={[
          styles.previewCard,
          { backgroundColor: palette.surface, borderColor: palette.border },
        ]}
      >
        <View style={styles.previewHeader}>
          <Text style={[styles.previewTitle, { color: palette.text }]}>
            Today
          </Text>
          {state.opts.streaks ? (
            <View
              style={[
                styles.streakPill,
                { backgroundColor: palette.accentSoft },
              ]}
            >
              <Text style={[styles.streakText, { color: palette.accent }]}>
                5 days logged
              </Text>
            </View>
          ) : null}
        </View>

        {MEALS.map((meal) => (
          <MealCard
            key={meal.name}
            meal={meal}
            state={state}
            palette={palette}
          />
        ))}

        {!hasVisibleNumbers ? (
          <Text style={[styles.previewMessage, { color: palette.secondary }]}>
            No numbers are showing. You see what you ate and when.
          </Text>
        ) : null}

        {state.opts.totals && hasVisibleNumbers ? (
          <View style={[styles.totals, { borderTopColor: palette.border }]}>
            <Text style={[styles.eyebrow, { color: palette.secondary }]}>
              Day so far
            </Text>
            <View style={styles.chipList}>
              {visibleMacros.map((macro) => {
                const total = MEALS.reduce(
                  (sum, meal) => sum + meal.values[macro.id],
                  0,
                );
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
            <Text style={[styles.weightText, { color: palette.secondary }]}>
              Body weight
            </Text>
            <Text style={[styles.weightText, { color: palette.accent }]}>
              Add entry
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.previewNote, { color: palette.secondary }]}>
        These are sample meals to preview your choices. This is not your
        personal data.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
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
});
