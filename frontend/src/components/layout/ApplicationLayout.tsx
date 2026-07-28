import { Menu, type LucideIcon } from "lucide-react"
import { Link, Outlet, useLocation } from "react-router-dom"
import { BrandMark } from "@/components/navigation/BrandMark"
import { SkipLink } from "@/components/navigation/SkipLink"
import { ThemeToggle } from "@/components/navigation/ThemeToggle"
import { GlobalFooter } from "@/components/layout/GlobalFooter"
import { cn } from "@/lib/utils/cn"

export interface ApplicationNavigationItem {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
}

export interface ApplicationLayoutProps {
  navigation: readonly ApplicationNavigationItem[]
  productArea: string
  headerActions?: React.ReactNode
}

function NavigationList({
  navigation,
  onNavigate,
}: {
  navigation: readonly ApplicationNavigationItem[]
  onNavigate?: () => void
}): React.JSX.Element {
  const location = useLocation()

  return (
    <nav aria-label="Primary navigation" className="flex flex-col gap-1">
      {navigation.map((item) => {
        const Icon = item.icon
        return (
          <Link
            aria-current={
              location.pathname === item.to.split("#")[0] &&
              location.hash === (item.to.includes("#") ? `#${item.to.split("#")[1]}` : "")
                ? "page"
                : undefined
            }
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              location.pathname === item.to.split("#")[0] &&
                location.hash === (item.to.includes("#") ? `#${item.to.split("#")[1]}` : "") &&
                "bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
            )}
            key={item.to}
            to={item.to}
            {...(onNavigate ? { onClick: onNavigate } : {})}
          >
            <Icon aria-hidden="true" className="size-5" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export function ApplicationLayout({
  headerActions,
  navigation,
  productArea,
}: ApplicationLayoutProps): React.JSX.Element {
  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
      <SkipLink />
      <aside className="fixed inset-y-0 left-0 hidden w-62 border-r border-border/80 bg-white/90 p-4 backdrop-blur-xl dark:bg-card/95 lg:flex lg:flex-col">
        <BrandMark className="mb-6 px-1" />
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {productArea}
        </p>
        <NavigationList navigation={navigation} />
      </aside>

      <div className="flex min-h-svh min-w-0 flex-col lg:col-start-2">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border/75 bg-white/80 px-4 backdrop-blur-xl dark:bg-card/85 sm:px-6 lg:px-8">
          <details className="group relative lg:hidden">
            <summary className="flex size-11 cursor-pointer list-none items-center justify-center rounded-md text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
              <Menu aria-hidden="true" className="size-5" />
              <span className="sr-only">Open navigation</span>
            </summary>
            <div className="absolute left-0 top-13 z-50 w-72 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-xl">
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {productArea}
              </p>
              <NavigationList navigation={navigation} />
            </div>
          </details>
          <BrandMark className="lg:hidden" compact />
          <div className="ml-auto flex items-center gap-2">
            {headerActions}
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-7 lg:px-8" id="main-content">
          <div className="mx-auto w-full max-w-[94rem]"><Outlet /></div>
        </main>
        <GlobalFooter />
      </div>
    </div>
  )
}
