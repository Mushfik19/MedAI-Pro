import { Link, Outlet } from "react-router-dom"
import { GlobalFooter } from "@/components/layout/GlobalFooter"
import { PageContainer } from "@/components/layout/PageContainer"
import { BrandMark } from "@/components/navigation/BrandMark"
import { SkipLink } from "@/components/navigation/SkipLink"
import { ThemeToggle } from "@/components/navigation/ThemeToggle"
import { Button } from "@/components/ui/button"

export function PublicLayout(): React.JSX.Element {
  return (
    <div className="flex min-h-svh flex-col">
      <SkipLink />
      <header className="sticky top-0 z-40 border-b border-border/75 bg-white/85 backdrop-blur-xl dark:bg-card/85">
        <PageContainer className="flex h-16 items-center justify-between">
          <BrandMark />
          <nav aria-label="Public navigation" className="hidden items-center gap-7 lg:flex">
            <a className="text-sm font-semibold text-muted-foreground hover:text-foreground" href="/#features">Features</a>
            <a className="text-sm font-semibold text-muted-foreground hover:text-foreground" href="/#workflow">How it works</a>
            <a className="text-sm font-semibold text-muted-foreground hover:text-foreground" href="/#safety">Safety</a>
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Button asChild className="hidden sm:inline-flex" variant="ghost">
              <Link to="/auth/login">Sign in</Link>
            </Button>
            <Button asChild size="sm"><Link to="/auth/register">Get started</Link></Button>
          </div>
        </PageContainer>
      </header>
      <main className="flex flex-1 items-center py-8 sm:py-12" id="main-content">
        <PageContainer><Outlet /></PageContainer>
      </main>
      <GlobalFooter />
    </div>
  )
}
