import {
  ArrowUp, BookOpen, Bot, BriefcaseBusiness, CircleHelp, Clock3, Code2,
  FileText, Globe2, HeartPulse, LayoutDashboard, Mail, Settings, ShieldCheck,
  Stethoscope, UserRound,
} from "lucide-react"
import { Link } from "react-router-dom"
import { PageContainer } from "@/components/layout/PageContainer"

const quickLinks = [
  ["Dashboard", "/dashboard", LayoutDashboard],
  ["Disease Prediction", "/predict", Stethoscope],
  ["Assessment History", "/assessments", Clock3],
  ["AI Medical Assistant", "/chat", Bot],
  ["Profile", "/profile", UserRound],
  ["Settings", "/settings", Settings],
] as const

const resourceLinks = [
  ["Privacy Policy", "#privacy", ShieldCheck],
  ["Terms of Service", "#terms", FileText],
  ["Contact", "mailto:hello@example.com", Mail],
  ["Help Center", "#help", CircleHelp],
  ["Documentation", "#documentation", BookOpen],
] as const

const developerLinks = [
  ["GitHub", "https://github.com/", Code2],
  ["LinkedIn", "https://www.linkedin.com/", BriefcaseBusiness],
  ["Portfolio", "#portfolio", Globe2],
  ["Email", "mailto:hello@example.com", Mail],
] as const

const linkClass =
  "group inline-flex w-fit items-center gap-2 text-sm text-slate-600 transition-all duration-200 hover:translate-x-0.5 hover:text-blue-700 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-300 dark:hover:text-blue-300"

export function GlobalFooter(): React.JSX.Element {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:text-white">
      <PageContainer className="py-10 sm:py-12">
        <div className="grid gap-10 sm:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_1.15fr] xl:gap-12">
          <section aria-labelledby="footer-brand">
            <Link className="inline-flex items-center gap-3 rounded-md font-display text-xl font-black tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" to="/">
              <span className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/20">
                <HeartPulse aria-hidden="true" className="size-5" />
              </span>
              <span id="footer-brand">MediAI Pro</span>
            </Link>
            <p className="mt-5 max-w-md text-sm font-bold leading-6 text-slate-800 dark:text-slate-200">
              AI-Powered Disease Prediction &amp; Clinical Decision Support System
            </p>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
              A modern AI healthcare platform that helps users assess symptoms,
              receive intelligent disease predictions, and access personalized
              health insights.
            </p>
          </section>

          <FooterLinkSection title="Quick Links">
            {quickLinks.map(([label, to, Icon]) => (
              <Link className={linkClass} key={to} to={to}>
                <Icon aria-hidden="true" className="size-4 text-blue-600" />{label}
              </Link>
            ))}
          </FooterLinkSection>

          <FooterLinkSection title="Resources">
            {resourceLinks.map(([label, href, Icon]) => (
              <a className={linkClass} href={href} key={label}>
                <Icon aria-hidden="true" className="size-4 text-blue-600" />{label}
              </a>
            ))}
          </FooterLinkSection>

          <section aria-labelledby="footer-developer">
            <h2 className="text-sm font-black uppercase tracking-[0.14em]" id="footer-developer">Developer</h2>
            <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-500">Developed by</p>
            <p className="mt-1 text-lg font-black">Mushfik Arman</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Full Stack Developer &amp; AI Enthusiast</p>
            <nav aria-label="Developer links" className="mt-5 grid grid-cols-2 gap-3">
              {developerLinks.map(([label, href, Icon]) => (
                <a className={linkClass} href={href} key={label}
                  rel={href.startsWith("http") ? "noreferrer" : undefined}
                  target={href.startsWith("http") ? "_blank" : undefined}>
                  <Icon aria-hidden="true" className="size-4 text-blue-600" />{label}
                </a>
              ))}
            </nav>
          </section>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-slate-200 pt-6 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 lg:flex-row lg:items-center">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span>© 2026 MediAI Pro. All Rights Reserved.</span>
            <span>Designed &amp; Developed by Mushfik Arman.</span>
            <span className="rounded-full border border-slate-200 px-2.5 py-1 font-semibold dark:border-slate-700">Version 1.0.0</span>
          </div>
          <button className="inline-flex min-h-10 w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 font-bold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 lg:ml-auto"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} type="button">
            Back to Top <ArrowUp aria-hidden="true" className="size-4" />
          </button>
        </div>
      </PageContainer>
    </footer>
  )
}

function FooterLinkSection({ children, title }: { children: React.ReactNode; title: string }): React.JSX.Element {
  const id = `footer-${title.toLowerCase().replaceAll(" ", "-")}`
  return (
    <section aria-labelledby={id}>
      <h2 className="text-sm font-black uppercase tracking-[0.14em]" id={id}>{title}</h2>
      <nav aria-label={title} className="mt-5 flex flex-col gap-3">{children}</nav>
    </section>
  )
}
