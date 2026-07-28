import { ArrowLeft, HeartPulse, Home, SearchX } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"

export function NotFoundPage(): React.JSX.Element {
  const location = useLocation()

  return (
    <section className="relative isolate mx-auto w-full max-w-4xl overflow-hidden rounded-[2rem] border border-primary/15 bg-card px-6 py-16 text-center shadow-[0_30px_100px_-45px_rgba(37,99,235,0.45)] sm:px-12 sm:py-24">
      <div
        aria-hidden="true"
        className="absolute -left-24 -top-24 -z-10 size-72 rounded-full bg-primary/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-28 -right-20 -z-10 size-72 rounded-full bg-cyan-400/15 blur-3xl"
      />
      <div className="mx-auto flex w-fit items-center gap-3 rounded-2xl border border-primary/15 bg-primary/7 px-4 py-2 text-primary">
        <HeartPulse className="size-5" />
        <span className="text-xs font-black uppercase tracking-[0.2em]">MediAI Pro</span>
      </div>
      <p className="mt-8 bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-8xl font-black tracking-tighter text-transparent sm:text-9xl">
        404
      </p>
      <div className="mx-auto mt-2 grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
        <SearchX className="size-7" />
      </div>
      <h1 className="mt-6 text-3xl font-black tracking-tight sm:text-4xl">This page is off the chart</h1>
      <p className="mx-auto mt-4 max-w-xl leading-7 text-muted-foreground">
        We could not find <span className="font-semibold text-foreground">{location.pathname}</span>.
        The address may be incorrect, or the resource may have moved.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link to="/">
            <Home className="size-4" />
            Return home
          </Link>
        </Button>
        <Button size="lg" variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="size-4" />
          Go back
        </Button>
      </div>
    </section>
  )
}
