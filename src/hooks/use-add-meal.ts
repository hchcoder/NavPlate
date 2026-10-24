import { useCallback, useState } from "react";

import { api } from "@/lib/api";

// Matches backend/Models/Enums/MealType.cs
export type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snack";

// Matches backend/Models/AddMealRequest.cs
export type NewMeal = {
  userId: number;
  type: MealType;
  // Local date and time, e.g. "2026-10-24T08:30:00" (no timezone)
  date: string;
  foodInstances: { food_Item: string; servings: number }[];
};

// Saves a meal: the backend creates the meals row and one
// food_instance row per food. Resolves with the new mealId.
export function useAddMeal() {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMeal = useCallback(async (meal: NewMeal) => {
    setIsSaving(true);
    setError(null);
    try {
      return await api.post<number>("/api/meal", meal);
    } catch (err) {
      console.error("Unable to save the meal.", err);
      setError("We couldn't save your meal. Please try again.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  return { addMeal, isSaving, error };
}
