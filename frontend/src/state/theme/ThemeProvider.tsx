import {
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react"
import {
  ThemeContext,
  type ThemeContextValue,
} from "@/state/theme/themeContext"
import type {
  MotionPreference,
  ResolvedTheme,
  ThemePreference,
} from "@/state/theme/theme.types"

const THEME_STORAGE_KEY = "mediai.theme"
const MOTION_STORAGE_KEY = "mediai.motion"

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system"
}

function isMotionPreference(value: string | null): value is MotionPreference {
  return value === "full" || value === "reduced" || value === "system"
}

function getStoredTheme(): ThemePreference {
  if (typeof window === "undefined") {
    return "system"
  }

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    return isThemePreference(stored) ? stored : "system"
  } catch {
    return "system"
  }
}

function getStoredMotion(): MotionPreference {
  if (typeof window === "undefined") {
    return "system"
  }

  try {
    const stored = window.localStorage.getItem(MOTION_STORAGE_KEY)
    return isMotionPreference(stored) ? stored : "system"
  } catch {
    return "system"
  }
}

export function ThemeProvider({
  children,
}: PropsWithChildren): React.JSX.Element {
  const [theme, setThemeState] = useState<ThemePreference>(getStoredTheme)
  const [motion, setMotionState] = useState<MotionPreference>(getStoredMotion)
  const [systemDark, setSystemDark] = useState(false)
  const [systemReduceMotion, setSystemReduceMotion] = useState(false)

  useEffect(() => {
    const darkQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")

    const syncPreferences = (): void => {
      setSystemDark(darkQuery.matches)
      setSystemReduceMotion(motionQuery.matches)
    }

    syncPreferences()
    darkQuery.addEventListener("change", syncPreferences)
    motionQuery.addEventListener("change", syncPreferences)

    return () => {
      darkQuery.removeEventListener("change", syncPreferences)
      motionQuery.removeEventListener("change", syncPreferences)
    }
  }, [])

  const resolvedTheme: ResolvedTheme =
    theme === "system" ? (systemDark ? "dark" : "light") : theme
  const reduceMotion =
    motion === "system" ? systemReduceMotion : motion === "reduced"

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("dark", resolvedTheme === "dark")
    root.dataset.theme = resolvedTheme
    root.dataset.reducedMotion = String(reduceMotion)
    root.style.colorScheme = resolvedTheme

    const themeMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    )
    themeMeta?.setAttribute(
      "content",
      resolvedTheme === "dark" ? "#020617" : "#f8fafc",
    )
  }, [reduceMotion, resolvedTheme])

  const setTheme = (nextTheme: ThemePreference): void => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    } catch {
      // The preference remains valid for the active session.
    }
    setThemeState(nextTheme)
  }

  const setMotion = (nextMotion: MotionPreference): void => {
    try {
      window.localStorage.setItem(MOTION_STORAGE_KEY, nextMotion)
    } catch {
      // The preference remains valid for the active session.
    }
    setMotionState(nextMotion)
  }

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      motion,
      reduceMotion,
      setTheme,
      setMotion,
    }),
    [motion, reduceMotion, resolvedTheme, theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
