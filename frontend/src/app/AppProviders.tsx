import { useState, type PropsWithChildren } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { MotionConfig } from "framer-motion"
import { Toaster } from "sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "@/state/auth/AuthProvider"
import { createQueryClient } from "@/state/query/createQueryClient"
import { ThemeProvider } from "@/state/theme/ThemeProvider"
import { useTheme } from "@/state/theme/useTheme"

function ExperienceProviders({
  children,
}: PropsWithChildren): React.JSX.Element {
  const { reduceMotion, resolvedTheme } = useTheme()

  return (
    <MotionConfig reducedMotion={reduceMotion ? "always" : "user"}>
      <TooltipProvider delayDuration={300}>
        <AuthProvider>{children}</AuthProvider>
        <Toaster
          closeButton
          position="top-right"
          richColors
          theme={resolvedTheme}
        />
      </TooltipProvider>
    </MotionConfig>
  )
}

export function AppProviders({
  children,
}: PropsWithChildren): React.JSX.Element {
  const [queryClient] = useState(createQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ExperienceProviders>{children}</ExperienceProviders>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
