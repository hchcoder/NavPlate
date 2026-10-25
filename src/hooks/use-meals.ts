import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import type { MealType } from "@/hooks/use-add-meal";
import { api } from "@/lib/api";

// Matches backend/Models/MealFood.cs (numbers already × servings)
export type MealFood = {
  food_Item: string;
  servings: number;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugars: number;
  sodium: number;
};

// Matches backend/Models/Meal.cs (totals are added up by the backend)
export type Meal = {
  mealId: number;
  userId: number;
  mealType: MealType;
  // Local date and time, e.g. "2026-10-24T08:30:00"
  date: string;
  foods: MealFood[];
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugars: number;
  sodium: number;
};

// "2026-10-24" for the phone's local day
export function localDateString(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Loads a user's meals for one day (or every day when date is null), and
// reloads every time the screen is opened so a meal saved on the Add Meal
// tab shows up.
export function useMeals(userId: number | null, date: string | null) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (userId === null) {
        setMeals([]);
        return;
      }

      let active = true;
      setIsLoading(true);

      api
        .get<Meal[]>(
          `/api/meal?userId=${userId}${date !== null ? `&date=${date}` : ""}`,
        )
        .then((loaded) => {
          if (active) {
            setMeals(loaded);
            setError(null);
          }
        })
        .catch((err) => {
          // Keep showing the last meals we had; just report the failure.
          console.error("Unable to load meals.", err);
          if (active) {
            setError("We couldn't load your meals. Check your connection.");
          }
        })
        .finally(() => {
          if (active) {
            setIsLoading(false);
          }
        });

      return () => {
        active = false;
      };
    }, [userId, date]),
  );

  return { meals, isLoading, error };
}
