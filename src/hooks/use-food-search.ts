import { useEffect, useState } from "react";

import { api } from "@/lib/api";

// The parts of backend/Models/Food.cs the search list needs
// (ASP.NET camelCases the names, so Food_Item arrives as food_Item).
export type FoodResult = {
  food_Item: string;
  category: string;
};

// Searches foods ~300ms after the user stops typing.
// An empty query sends nothing (the backend would return every food).
export function useFoodSearch(query: string) {
  const [results, setResults] = useState<FoodResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const text = query.trim();
    if (text === "") {
      setResults([]);
      setIsSearching(false);
      setError(null);
      return;
    }

    let active = true;
    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        const foods = await api.get<FoodResult[]>(
          `/api/food?searchText=${encodeURIComponent(text)}`,
        );
        if (active) {
          setResults(foods);
          setError(null);
        }
      } catch (err) {
        console.error("Unable to search foods.", err);
        if (active) {
          setResults([]);
          setError("We couldn't search foods. Check your connection.");
        }
      } finally {
        if (active) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  return { results, isSearching, error };
}
