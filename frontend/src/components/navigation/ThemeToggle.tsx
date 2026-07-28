import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTheme } from "@/state/theme/useTheme"

export function ThemeToggle(): React.JSX.Element {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const label = isDark ? "Use light theme" : "Use dark theme"

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={label}
          onClick={() => setTheme(isDark ? "light" : "dark")}
          size="icon"
          variant="ghost"
        >
          {isDark ? (
            <Sun aria-hidden="true" />
          ) : (
            <Moon aria-hidden="true" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
