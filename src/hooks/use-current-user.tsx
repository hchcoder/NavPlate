import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { api, ApiError } from "@/lib/api";

// Only the id is kept on the phone; everything else comes from the backend.
const USER_ID_KEY = "navplate-user-id";

// Matches backend/Models/User.cs (ASP.NET sends the names in camelCase).
export type User = {
  userId: number;
  username: string;
  seeCalories: boolean;
  seeProtein: boolean;
  seeCarbs: boolean;
  seeFat: boolean;
  seeFiber: boolean;
  seeSugar: boolean;
  seeSodium: boolean;
};

// Matches backend/Models/CreateUserRequest.cs
export type NewUser = Omit<User, "userId">;

// Matches backend/Models/UpdateUserRequest.cs
export type UserPreferences = Omit<User, "userId" | "username">;

type CurrentUser = {
  user: User | null;
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;
  createUser: (newUser: NewUser) => Promise<User>;
  updateUser: (preferences: UserPreferences) => Promise<User>;
};

const CurrentUserContext = createContext<CurrentUser | null>(null);

// Wraps the app in _layout.tsx so every tab sees the same user.
export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On launch, load the user whose id was saved on this phone (if any).
  useEffect(() => {
    let active = true;

    async function loadSavedUser() {
      try {
        const savedId = await AsyncStorage.getItem(USER_ID_KEY);
        if (savedId === null) {
          return;
        }
        const loaded = await api.get<User>(`/api/user/${savedId}`);
        if (active) {
          setUser(loaded);
        }
      } catch (err) {
        // The saved user no longer exists in the database: start fresh.
        if (err instanceof ApiError && err.status === 404) {
          await AsyncStorage.removeItem(USER_ID_KEY);
          return;
        }
        console.error("Unable to load the current user.", err);
        if (active) {
          setError("We couldn't load your profile. Check your connection.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadSavedUser();
    return () => {
      active = false;
    };
  }, []);

  const createUser = useCallback(async (newUser: NewUser) => {
    setIsCreating(true);
    setError(null);
    try {
      const created = await api.post<User>("/api/user", newUser);
      await AsyncStorage.setItem(USER_ID_KEY, String(created.userId));
      setUser(created);
      return created;
    } catch (err) {
      console.error("Unable to create the user.", err);
      setError("We couldn't save your profile. Please try again.");
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, []);

  // Saves changed preferences for the user who already exists.
  const updateUser = useCallback(
    async (preferences: UserPreferences) => {
      if (user === null) {
        throw new Error("There is no user to update yet.");
      }
      setError(null);
      try {
        const updated = await api.put<User>(
          `/api/user/${user.userId}`,
          preferences,
        );
        setUser(updated);
        return updated;
      } catch (err) {
        console.error("Unable to update the user.", err);
        setError("We couldn't save your profile. Please try again.");
        throw err;
      }
    },
    [user],
  );

  return (
    <CurrentUserContext.Provider
      value={{ user, isLoading, isCreating, error, createUser, updateUser }}
    >
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const value = useContext(CurrentUserContext);
  if (value === null) {
    throw new Error("useCurrentUser must be used inside CurrentUserProvider.");
  }
  return value;
}
