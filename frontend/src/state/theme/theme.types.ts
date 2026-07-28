export type ThemePreference = "light" | "dark" | "system"
export type MotionPreference = "full" | "reduced" | "system"
export type ResolvedTheme = Exclude<ThemePreference, "system">
