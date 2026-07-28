import { ShieldCheck } from "lucide-react"
import { Outlet } from "react-router-dom"
import { GlobalFooter } from "@/components/layout/GlobalFooter"
import { BrandMark } from "@/components/navigation/BrandMark"
import { SkipLink } from "@/components/navigation/SkipLink"
import { ThemeToggle } from "@/components/navigation/ThemeToggle"

export function AuthLayout(): React.JSX.Element {
  return (
    <div className="flex min-h-svh flex-col">
      <SkipLink />
      <div className="grid flex-1 lg:grid-cols-[minmax(22rem,0.8fr)_minmax(32rem,1.2fr)]">
        <aside className="relative hidden overflow-hidden border-r border-blue-200 bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-600 p-10 text-white lg:flex lg:flex-col">
          <div className="pointer-events-none absolute -right-32 -top-32 size-96 rounded-full border-[4rem] border-white/5" />
          <BrandMark className="text-white" />
          <div className="my-auto max-w-lg">
            <ShieldCheck aria-hidden="true" className="mb-6 size-10 text-cyan-300" />
            <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-[-0.04em]">
              Secure access to responsible clinical decision support.
            </h1>
            <p className="mt-5 text-base leading-7 text-blue-100">
              Your account, consent, and access controls protect every clinical workflow.
            </p>
          </div>
          <p className="text-sm leading-6 text-blue-100">Not a diagnosis or emergency service.</p>
        </aside>
        <div className="flex min-w-0 flex-col">
          <header className="flex h-16 items-center justify-between border-b border-border/75 bg-white/80 px-4 backdrop-blur-xl dark:bg-card/80 sm:px-8 lg:justify-end">
            <BrandMark className="lg:hidden" />
            <ThemeToggle />
          </header>
          <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8" id="main-content">
            <div className="w-full max-w-md"><Outlet /></div>
          </main>
        </div>
      </div>
      <GlobalFooter />
    </div>
  )
}
