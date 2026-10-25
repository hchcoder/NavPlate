import { useState } from "react";
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
import { useAddMeal, type MealType } from "@/hooks/use-add-meal";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useFoodSearch } from "@/hooks/use-food-search";
import { localDateString } from "@/hooks/use-meals";
import { useTheme } from "@/hooks/use-theme";
import { colors } from "@/styles/global";

// Foods come from the C# backend; id is the food_item name (foods' primary key).
type Food = {
  id: string;
  name: string;
  category?: string;
};
type MealFood = { key: number; food: Food; servings: number };
type Period = "AM" | "PM";
type MealTime = { hour: number; minute: number; period: Period };
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

const TYPES: MealType[] = ["Breakfast", "Lunch", "Dinner", "Snack"];
const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);
const PERIODS: Period[] = ["AM", "PM"];

// Phone's current time, rounded down to the nearest 5 minutes.
const now = (): MealTime => {
  const d = new Date();
  const h = d.getHours();
  return {
    hour: h % 12 === 0 ? 12 : h % 12,
    minute: Math.floor(d.getMinutes() / 5) * 5,
    period: h < 12 ? "AM" : "PM",
  };
};
const formatTime = ({ hour, minute, period }: MealTime) =>
  `${hour}:${String(minute).padStart(2, "0")} ${period}`;
// Picked date with the picked time, e.g. "2026-10-24T08:30:00" (local, no timezone).
const toDateTime = (date: string, { hour, minute, period }: MealTime) => {
  const hour24 = (hour % 12) + (period === "PM" ? 12 : 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date}T${pad(hour24)}:${pad(minute)}:00`;
};
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// Today and the 30 days before it, as "2026-10-24" (no future dates).
const recentDays = () => {
  const d = new Date();
  return Array.from({ length: 31 }, (_, i) =>
    localDateString(new Date(d.getFullYear(), d.getMonth(), d.getDate() - i)),
  );
};
// "2026-10-22" -> "Today", "Yesterday", or "Thu Oct 22"
const formatDay = (date: string) => {
  const [today, yesterday] = recentDays();
  if (date === today) return "Today";
  if (date === yesterday) return "Yesterday";
  const [y, m, d] = date.split("-").map(Number);
  const day = new Date(y, m - 1, d);
  return `${DAY_NAMES[day.getDay()]} ${MONTHS[day.getMonth()]} ${day.getDate()}`;
};
const guessType = (): MealType => {
  const h = new Date().getHours();
  return h < 11 ? "Breakfast" : h < 15 ? "Lunch" : h >= 17 && h < 21 ? "Dinner" : "Snack";
};

export default function AddMeal() {
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
  const [type, setType] = useState<MealType>(guessType);
  const [date, setDate] = useState(() => localDateString());
  const [dateOpen, setDateOpen] = useState(false);
  const [time, setTime] = useState(now);
  const [timeOpen, setTimeOpen] = useState(false);
  const [foods, setFoods] = useState<MealFood[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [nextKey, setNextKey] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  // No backend endpoint for these yet, so they stay empty.
  const [recentFoods] = useState<Food[]>([]);
  const [popularFoods] = useState<Food[]>([]);

  const { user } = useCurrentUser();
  const { addMeal, isSaving, error: saveError } = useAddMeal();
  const { results, isSearching, error: searchError } = useFoodSearch(query);
  const searchResults: Food[] = results.map((f) => ({
    id: f.food_Item,
    name: f.food_Item,
    category: f.category,
  }));

  const q = query.trim();
  const options: Food[] = q
    ? searchResults
    : [...recentFoods, ...popularFoods.filter((p) => !recentFoods.some((r) => r.id === p.id))].slice(0, 8);

  const add = (food: Food) => {
    setFoods((list) => [...list, { key: nextKey, food, servings: 1 }]);
    setSaved(false);
    setNextKey((k) => k + 1);
    setQuery("");
    setOpen(false);
  };
  const bump = (key: number, d: number) =>
    setFoods((list) => list.map((f) => (f.key === key ? { ...f, servings: Math.max(0.5, f.servings + d) } : f)));
  const remove = (key: number) => setFoods((list) => list.filter((f) => f.key !== key));

  async function saveMeal() {
    if (!user) {
      setFormError("Finish the Setup tab first so we know who you are.");
      return;
    }
    if (foods.length === 0) {
      setFormError("Add at least one food.");
      return;
    }

    setFormError(null);
    setSaved(false);
    try {
      await addMeal({
        userId: user.userId,
        type,
        date: toDateTime(date, time),
        foodInstances: foods.map(({ food, servings }) => ({
          food_Item: food.id,
          servings,
        })),
      });
      // Only clear the form once the meal is saved.
      setFoods([]);
      setType(guessType());
      setDate(localDateString());
      setTime(now());
      setSaved(true);
    } catch {
      // useAddMeal sets the error message; the form keeps what was entered.
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentInner}>
            <Text style={[styles.pageTitle, { color: palette.text }]}>Add a meal</Text>
            <Text style={[styles.muted, { color: palette.secondary }]}>
              Search for what you had and choose how many servings.
            </Text>

            <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <Text style={[styles.cardTitle, { color: palette.text }]}>When</Text>
              <View style={styles.chips}>
                {TYPES.map((t) => {
                  const selected = type === t;
                  return (
                    <Pressable
                      key={t}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setType(t)}
                      style={({ pressed }) => [
                        styles.chip,
                        {
                          backgroundColor: selected ? palette.accent : palette.background,
                          borderColor: selected ? palette.accent : palette.border,
                          opacity: pressed ? 0.75 : 1,
                        },
                      ]}
                    >
                      <Text style={{ color: selected ? palette.accentText : palette.text }}>{t}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.timeRow}>
                <Text style={[styles.label, { color: palette.text }]}>Date</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Date, ${formatDay(date)}`}
                  accessibilityState={{ expanded: dateOpen }}
                  onPress={() => setDateOpen((o) => !o)}
                  style={({ pressed }) => [
                    styles.field,
                    { backgroundColor: palette.background, borderColor: palette.border, opacity: pressed ? 0.75 : 1 },
                  ]}
                >
                  <Text style={{ color: palette.text }}>{formatDay(date)}</Text>
                </Pressable>
              </View>
              {dateOpen && (
                <View style={[styles.timeMenu, { backgroundColor: palette.background, borderColor: palette.border }]}>
                  <TimeColumn
                    values={recentDays()}
                    selected={date}
                    format={formatDay}
                    palette={palette}
                    onSelect={setDate}
                  />
                </View>
              )}

              <View style={styles.timeRow}>
                <Text style={[styles.label, { color: palette.text }]}>Time</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Time, ${formatTime(time)}`}
                  accessibilityState={{ expanded: timeOpen }}
                  onPress={() => setTimeOpen((o) => !o)}
                  style={({ pressed }) => [
                    styles.field,
                    { backgroundColor: palette.background, borderColor: palette.border, opacity: pressed ? 0.75 : 1 },
                  ]}
                >
                  <Text style={{ color: palette.text }}>{formatTime(time)}</Text>
                </Pressable>
              </View>
              {timeOpen && (
                <View style={[styles.timeMenu, { backgroundColor: palette.background, borderColor: palette.border }]}>
                  <TimeColumn
                    values={HOURS}
                    selected={time.hour}
                    format={String}
                    palette={palette}
                    onSelect={(hour) => setTime((t) => ({ ...t, hour }))}
                  />
                  <TimeColumn
                    values={MINUTES}
                    selected={time.minute}
                    format={(m) => String(m).padStart(2, "0")}
                    palette={palette}
                    onSelect={(minute) => setTime((t) => ({ ...t, minute }))}
                  />
                  <TimeColumn
                    values={PERIODS}
                    selected={time.period}
                    format={String}
                    palette={palette}
                    onSelect={(period) => setTime((t) => ({ ...t, period }))}
                  />
                </View>
              )}
            </View>

            <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <Text style={[styles.cardTitle, { color: palette.text }]}>What you had</Text>
              <TextInput
                accessibilityLabel="Search for a food or drink"
                placeholder="Search for a food or drink"
                placeholderTextColor={palette.secondary}
                value={query}
                onChangeText={(text) => {
                  setQuery(text);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onSubmitEditing={() => options[0] && add(options[0])}
                style={[
                  styles.field,
                  { backgroundColor: palette.background, borderColor: palette.border, color: palette.text },
                ]}
              />
              {open && (options.length > 0 || q !== "") && (
                <View style={[styles.menu, { backgroundColor: palette.background, borderColor: palette.border }]}>
                  <Text style={[styles.group, { color: palette.secondary }]}>
                    {!q
                      ? "Recent and popular"
                      : isSearching && !searchResults.length
                        ? "Searching…"
                        : searchError
                          ? searchError
                          : searchResults.length
                            ? "Results"
                            : `No foods match “${q}”`}
                  </Text>
                  {options.map((f) => (
                    <Pressable
                      key={f.id}
                      accessibilityRole="button"
                      onPress={() => add(f)}
                      style={({ pressed }) => [
                        styles.option,
                        { backgroundColor: pressed ? palette.raised : "transparent" },
                      ]}
                    >
                      <View style={styles.flex}>
                        <Text style={[styles.bold, { color: palette.text }]}>{f.name}</Text>
                        {f.category ? (
                          <Text style={[styles.small, { color: palette.secondary }]}>{f.category}</Text>
                        ) : null}
                      </View>
                      <View style={[styles.plus, { borderColor: palette.accent }]}>
                        <Text style={[styles.bold, { color: palette.accent }]}>+</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}

              {foods.length === 0 ? (
                <Text style={[styles.muted, { color: palette.secondary }]}>Nothing added yet.</Text>
              ) : (
                <View>
                  {foods.map(({ key, food, servings }) => (
                    <View key={key} style={[styles.foodRow, { borderTopColor: palette.border }]}>
                      <View style={styles.flex}>
                        <Text style={[styles.bold, { color: palette.text }]}>{food.name}</Text>
                        <Text style={[styles.small, { color: palette.secondary }]}>
                          {servings} serving{servings === 1 ? "" : "s"}
                        </Text>
                      </View>
                      <View style={[styles.stepper, { borderColor: palette.border }]}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Fewer servings of ${food.name}`}
                          disabled={servings <= 0.5}
                          onPress={() => bump(key, -0.5)}
                          style={[styles.stepButton, { backgroundColor: palette.raised, opacity: servings <= 0.5 ? 0.4 : 1 }]}
                        >
                          <Text style={[styles.stepText, { color: palette.text }]}>−</Text>
                        </Pressable>
                        <Text style={[styles.stepValue, { color: palette.text }]}>{servings}</Text>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`More servings of ${food.name}`}
                          onPress={() => bump(key, 0.5)}
                          style={[styles.stepButton, { backgroundColor: palette.raised }]}
                        >
                          <Text style={[styles.stepText, { color: palette.text }]}>+</Text>
                        </Pressable>
                      </View>
                      <Pressable accessibilityRole="button" onPress={() => remove(key)}>
                        <Text style={[styles.bold, { color: palette.accent }]}>Remove</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: isSaving }}
              disabled={isSaving}
              onPress={() => void saveMeal()}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: palette.accent, opacity: isSaving ? 0.55 : pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={[styles.bold, { color: palette.accentText }]}>
                {isSaving ? "Saving…" : "Save meal"}
              </Text>
            </Pressable>
            {formError || saveError ? (
              <Text accessibilityRole="alert" style={styles.errorText}>
                {formError ?? saveError}
              </Text>
            ) : saved ? (
              <Text style={[styles.muted, { color: palette.secondary }]}>Meal saved.</Text>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function TimeColumn<T extends string | number>({
  values,
  selected,
  format,
  palette,
  onSelect,
}: {
  values: readonly T[];
  selected: T;
  format: (value: T) => string;
  palette: Palette;
  onSelect: (value: T) => void;
}) {
  return (
    <ScrollView style={styles.timeColumn} nestedScrollEnabled showsVerticalScrollIndicator={false}>
      {values.map((v) => {
        const isSelected = v === selected;
        return (
          <Pressable
            key={v}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(v)}
            style={[styles.timeOption, { backgroundColor: isSelected ? palette.accent : "transparent" }]}
          >
            <Text style={{ color: isSelected ? palette.accentText : palette.text }}>{format(v)}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.five,
    paddingBottom: BottomTabInset + Spacing.five,
    alignItems: "center",
  },
  contentInner: { width: "100%", maxWidth: MaxContentWidth, gap: Spacing.three },
  pageTitle: { fontSize: 32, fontWeight: "700" },
  muted: { fontSize: 15 },
  card: { borderWidth: 1, borderRadius: 14, padding: 18, gap: 14 },
  cardTitle: { fontSize: 18, fontWeight: "600" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
  chip: { borderWidth: 1.5, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 14 },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  label: { fontWeight: "600" },
  field: { borderWidth: 1.5, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, fontSize: 16 },
  timeMenu: { flexDirection: "row", borderWidth: 1, borderRadius: 12, padding: 6, gap: 6 },
  timeColumn: { flex: 1, maxHeight: 200 },
  timeOption: { paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  menu: { borderWidth: 1, borderRadius: 12, padding: 6 },
  group: { fontSize: 12, textTransform: "uppercase", letterSpacing: 1, paddingTop: 8, paddingHorizontal: 10, paddingBottom: 4 },
  option: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, paddingVertical: 9, paddingHorizontal: 10, borderRadius: 8 },
  flex: { flex: 1, minWidth: 0 },
  bold: { fontWeight: "600" },
  small: { fontSize: 14 },
  plus: { width: 26, height: 26, borderWidth: 1.5, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  foodRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderTopWidth: 1 },
  stepper: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: 10, overflow: "hidden" },
  stepButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  stepText: { fontSize: 18 },
  stepValue: { minWidth: 40, textAlign: "center", fontVariant: ["tabular-nums"] },
  primaryButton: { alignSelf: "flex-start", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 26 },
  errorText: { color: "#b42318", fontSize: 14, lineHeight: 20 },
});
