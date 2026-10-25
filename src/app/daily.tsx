import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  localDateString,
  useMeals,
  type Meal as SavedMeal,
} from "@/hooks/use-meals";
import { useTheme } from "@/hooks/use-theme";
import { colors } from "@/styles/global";

// Must match the key and shape the Setup tab (index.tsx) saves.
const STORAGE_KEY = "navplate-setup";

// Macro switches, add a curly brace section for new button
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

type Meal = {
  id: number;
  name: string;
  time: string;
  foods: string;
  values: Record<MacroId, number>;
};

// "2026-10-24T08:30:00" -> "8:30 AM" (read straight from the text, no timezone math)
function formatTime(date: string) {
  const [hour, minute] = date.slice(11, 16).split(":").map(Number);
  const period = hour < 12 ? "AM" : "PM";
  return `${hour % 12 === 0 ? 12 : hour % 12}:${String(minute).padStart(2, "0")} ${period}`;
}

// One decimal place, e.g. 12.25 -> 12.3
const round = (value: number) => Math.round(value * 10) / 10;

// Backend meal -> what the meal cards and week rows show
function toMeal(meal: SavedMeal): Meal {
  return {
    id: meal.mealId,
    name: meal.mealType,
    time: formatTime(meal.date),
    foods: meal.foods.map((food) => food.food_Item).join(", "),
    values: {
      cal: round(meal.calories),
      pro: round(meal.protein),
      carb: round(meal.carbohydrates),
      fat: round(meal.fat),
      fib: round(meal.fiber),
      sug: round(meal.sugars),
      sod: round(meal.sodium),
    },
  };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Local midnight, `days` days after `date`
function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

// The Sunday that starts the week containing `date`
function startOfWeek(date: Date) {
  return addDays(date, -date.getDay());
}

// "2026-10-24T08:30:00" -> that day at local midnight
function dayOf(date: string) {
  const [year, month, day] = date.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}

// "Mar 15 – 21", or "Mar 29 – Apr 4" when the week crosses a month
function formatWeekRange(start: Date) {
  const end = addDays(start, 6);
  const from = `${MONTHS[start.getMonth()]} ${start.getDate()}`;
  const to =
    end.getMonth() === start.getMonth()
      ? `${end.getDate()}`
      : `${MONTHS[end.getMonth()]} ${end.getDate()}`;
  return `${from} – ${to}`;
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

// Same defaults as the Setup tab, used until a saved setup loads.
const DEFAULT_STATE: SetupState = {
  macros: { cal: false, pro: true, carb: true, fat: true, fib: true, sug: false, sod: false },
};

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

// In 'meals so far' and in each meal card 
// Contains the like "Proteing 36g" or something like that
function MacroChip({
  macro,
  value,
  palette,
}: {
  macro: (typeof MACROS)[number];
  value: number;
  palette: Palette;
}) {
  return (
    <View
      accessibilityLabel={`${macro.label}, ${value} ${macro.unit}`}
      style={[styles.macroChip, { backgroundColor: palette.background }]}
    >
      <View style={[styles.chipDot, { backgroundColor: macro.color }]} />
      <Text style={[styles.chipLabel, { color: palette.text }]}>
        {macro.label}
      </Text>
      <Text style={[styles.chipValue, { color: palette.text }]}>
        {`${value} ${macro.unit}`}
      </Text>
    </View>
  );
}

// Pretty self-explanatory, is the meal card that is shown
function MealCard({
  meal,
  state,
  palette,
}: {
  meal: Meal;
  state: SetupState;
  palette: Palette;
}) {
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
      {meal.foods ? (
        <Text style={[styles.mealFoods, { color: palette.secondary }]}>
          {meal.foods}
        </Text>
      ) : null}
      {visibleMacros.length > 0 ? (
        <View style={styles.chipList}>
          {visibleMacros.map((macro) => (
            <MacroChip
              key={macro.id}
              macro={macro}
              value={meal.values[macro.id]}
              palette={palette}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

// Daily preview widget
function DailyPreview({
  state,
  palette,
  meals,
  isLoadingMeals,
}: {
  state: SetupState;
  palette: Palette;
  meals: readonly Meal[];
  isLoadingMeals: boolean;
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
        </View>

        {meals.length === 0 ? (
          <Text style={[styles.previewMessage, { color: palette.secondary }]}>
            {isLoadingMeals ? "Loading your meals..." : "No meals logged yet."}
          </Text>
        ) : (
          meals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              state={state}
              palette={palette}
            />
          ))
        )}

        {!hasVisibleNumbers ? (
          <Text style={[styles.previewMessage, { color: palette.secondary }]}>
            No numbers are showing. You see what you ate and when.
          </Text>
        ) : null}
      </View>
    </View>
  );
}

// Week widget under the Today box: one row per day (Sun–Sat), one line per meal.
// Arrows move a week at a time, from the week of the first logged meal up to this week.
function WeekView({
  state,
  palette,
  meals,
  isLoading,
  error,
}: {
  state: SetupState;
  palette: Palette;
  meals: readonly SavedMeal[];
  isLoading: boolean;
  error: string | null;
}) {
  const [weeksBack, setWeeksBack] = useState(0);
  const visibleMacros = MACROS.filter((macro) => state.macros[macro.id]);

  const thisWeek = startOfWeek(new Date());
  const firstMealDate = meals.reduce<string | null>(
    (earliest, meal) =>
      earliest === null || meal.date < earliest ? meal.date : earliest,
    null,
  );
  const firstWeek =
    firstMealDate !== null ? startOfWeek(dayOf(firstMealDate)) : thisWeek;
  const weekStart = addDays(thisWeek, -7 * weeksBack);
  const canGoBack = weekStart > firstWeek;
  const canGoForward = weeksBack > 0;
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const mealsByDay = new Map<string, Meal[]>();
  for (const meal of meals) {
    const key = meal.date.slice(0, 10);
    mealsByDay.set(key, [...(mealsByDay.get(key) ?? []), toMeal(meal)]);
  }

  return (
    <View
      style={[
        styles.weekCard,
        { backgroundColor: palette.surface, borderColor: palette.border },
      ]}
    >
      <View style={styles.weekHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous week"
          accessibilityState={{ disabled: !canGoBack }}
          disabled={!canGoBack}
          hitSlop={8}
          onPress={() => setWeeksBack((current) => current + 1)}
        >
          <Ionicons
            name="chevron-back"
            size={22}
            color={canGoBack ? palette.accent : palette.border}
          />
        </Pressable>
        <Text style={[styles.weekTitle, { color: palette.text }]}>
          {formatWeekRange(weekStart)}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next week"
          accessibilityState={{ disabled: !canGoForward }}
          disabled={!canGoForward}
          hitSlop={8}
          onPress={() => setWeeksBack((current) => current - 1)}
        >
          <Ionicons
            name="chevron-forward"
            size={22}
            color={canGoForward ? palette.accent : palette.border}
          />
        </Pressable>
      </View>

      {error ? (
        <Text
          accessibilityRole="alert"
          style={[styles.errorText, styles.weekMessage]}
        >
          {error}
        </Text>
      ) : null}

      {days.map((day) => {
        const dayMeals = mealsByDay.get(localDateString(day)) ?? [];
        return (
          <View
            key={day.toDateString()}
            style={[styles.weekRow, { borderTopColor: palette.border }]}
          >
            <View style={styles.weekDate}>
              <Text style={[styles.weekDateNumber, { color: palette.accent }]}>
                {`${day.getMonth() + 1}/${day.getDate()}`}
              </Text>
              <Text style={[styles.weekDateName, { color: palette.accent }]}>
                {DAY_NAMES[day.getDay()]}
              </Text>
            </View>
            <View
              style={[
                styles.weekMeals,
                {
                  backgroundColor: palette.raised,
                  borderLeftColor: palette.border,
                },
              ]}
            >
              {dayMeals.length === 0 ? (
                <Text style={[styles.weekMealLine, { color: palette.secondary }]}>
                  {isLoading ? "Loading..." : "No meals"}
                </Text>
              ) : (
                dayMeals.map((meal) => (
                  <Text
                    key={meal.id}
                    style={[styles.weekMealLine, { color: palette.text }]}
                  >
                    <Text style={styles.weekMealName}>{meal.name}</Text>
                    {visibleMacros.length > 0
                      ? `  ${visibleMacros
                          .map(
                            (macro) =>
                              `${macro.label} ${meal.values[macro.id]} ${macro.unit}`,
                          )
                          .join(" · ")}`
                      : ""}
                  </Text>
                ))
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

//Loading the whole screen for the Daily View
export default function DailyScreen() {
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
  const [state, setState] = useState<SetupState>(DEFAULT_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);
  const { user } = useCurrentUser();
  const {
    meals: savedMeals,
    isLoading: isLoadingMeals,
    error: mealsError,
  } = useMeals(user?.userId ?? null, localDateString());
  const meals: Meal[] = savedMeals.map(toMeal);
  // Every meal (no date filter) for the week widget and its arrow limits
  const {
    meals: allMeals,
    isLoading: isLoadingAllMeals,
    error: allMealsError,
  } = useMeals(user?.userId ?? null, null);

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

            {mealsError ? (
              <Text accessibilityRole="alert" style={styles.errorText}>
                {mealsError}
              </Text>
            ) : null}

            {!isLoading ? (
              <>
                <DailyPreview
                  state={state}
                  palette={palette}
                  meals={meals}
                  isLoadingMeals={isLoadingMeals}
                />
                <WeekView
                  state={state}
                  palette={palette}
                  meals={allMeals}
                  isLoading={isLoadingAllMeals}
                  error={allMealsError}
                />
              </>
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

// Specific for the Daily sheet, so we keep the style sheet here
const styles = StyleSheet.create({
  weekCard: {
    borderWidth: 1,
    borderRadius: 22,
    overflow: "hidden",
  },
  weekHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  weekTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  weekMessage: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  weekRow: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  weekDate: {
    width: 72,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.three,
  },
  weekDateNumber: {
    fontSize: 20,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  weekDateName: {
    fontSize: 13,
    fontWeight: "500",
  },
  weekMeals: {
    flex: 1,
    justifyContent: "center",
    gap: Spacing.one,
    borderLeftWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  weekMealLine: {
    fontSize: 13,
    lineHeight: 19,
  },
  weekMealName: {
    fontWeight: "700",
  },
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
  //Still want the error messages in red
  errorText: {
    color: "#b42318",
    fontSize: 14,
    lineHeight: 20,
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
  mealFoods: {
    fontSize: 13,
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
  previewMessage: {
    fontSize: 14,
    lineHeight: 20,
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
});
