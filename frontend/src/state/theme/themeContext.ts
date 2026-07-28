import { createContext } from "react"
import type {
  MotionPreference,
  ResolvedTheme,
  ThemePreference,
} from "@/state/theme/theme.types"

export interface ThemeContextValue {
  theme: ThemePreference
  resolvedTheme: ResolvedTheme
  motion: MotionPreference
  reduceMotion: boolean
  setTheme: (theme: ThemePreference) => void
  setMotion: (motion: MotionPreference) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
