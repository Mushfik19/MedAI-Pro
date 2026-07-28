import {
  Activity,
  ArrowRight,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"

const features = [
  {
    icon: BrainCircuit,
    title: "ML disease prediction",
    description:
      "A calibrated machine-learning workflow ranks up to five possible conditions.",
  },
  {
    icon: Activity,
    title: "Clinical risk signals",
    description:
      "Severity, confidence, red flags, and next-step guidance stay visually distinct.",
  },
  {
    icon: Bot,
    title: "Grounded AI explanations",
    description:
      "AI explains structured results but never calculates or changes predictions.",
  },
  {
    icon: Stethoscope,
    title: "Doctor collaboration",
    description:
      "Share selected records with an authorized clinician and retain an audit trail.",
  },
  {
    icon: ClipboardCheck,
    title: "Longitudinal insights",
    description:
      "Review prediction history, frequency trends, and accessible clinical reports.",
  },
  {
    icon: LockKeyhole,
    title: "Privacy by design",
    description:
      "Explicit consent, scoped access, session controls, and private records come first.",
  },
] as const

const workflow = [
  ["01", "Describe symptoms", "Select approved symptoms, intensity, and duration."],
  ["02", "Review the assessment", "Confirm every input and acknowledge the tool's limits."],
  ["03", "Understand the result", "Explore ranked candidates, evidence, tests, and specialist context."],
] as const

export function LandingPage(): React.JSX.Element {
  useDocumentTitle()

  return (
    <div className="-my-10 sm:-my-16">
      <section className="relative overflow-hidden py-16 sm:py-24 lg:py-28">
        <div className="absolute -left-32 top-10 -z-10 size-96 rounded-full bg-blue-300/25 blur-3xl dark:bg-blue-900/20" />
        <div className="absolute -right-32 top-32 -z-10 size-96 rounded-full bg-cyan-300/25 blur-3xl dark:bg-cyan-900/20" />
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42 }}
          >
            <Badge className="mb-6 gap-2 px-3 py-1" variant="outline">
              <Sparkles aria-hidden="true" className="size-3.5 text-primary" />
              Intelligent clinical decision support
            </Badge>
            <h1 className="max-w-4xl font-display text-4xl font-bold leading-[1.08] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              Understand health signals with{" "}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                clarity and care.
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              MediAI Pro combines calibrated machine learning, governed clinical
              knowledge, and grounded AI explanations in one responsible health
              assessment experience.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/predict">
                  Start an assessment
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/auth/login">Explore role dashboards</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
              {["Top-five differential", "Versioned results", "Human review ready"].map(
                (item) => (
                  <span className="inline-flex items-center gap-2" key={item}>
                    <CheckCircle2
                      aria-hidden="true"
                      className="size-4 text-green-600"
                    />
                    {item}
                  </span>
                ),
              )}
            </div>
          </motion.div>

          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.12, duration: 0.42 }}
          >
            <div className="absolute inset-8 -z-10 rounded-full bg-blue-500/20 blur-3xl" />
            <Card className="overflow-hidden border-white/50 bg-white/85 shadow-2xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/90">
              <CardHeader className="border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Assessment overview</CardTitle>
                    <CardDescription className="mt-1">
                      Prediction report • Versioned model
                    </CardDescription>
                  </div>
                  <Badge variant="success">Secure workflow</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 p-5 text-white">
                  <p className="text-sm font-medium text-blue-100">Structured assessment</p>
                  <p className="mt-2 font-display text-2xl font-bold">
                    Ranked clinical decision support
                  </p>
                  <p className="mt-3 text-sm leading-6 text-blue-100">
                    Probabilities, severity, recommended tests, and specialist guidance remain
                    traceable to a versioned model response.
                  </p>
                </div>
                {[
                  "Validated symptom intake",
                  "Deterministic ML prediction",
                  "Grounded explanation and safety guidance",
                ].map((label, index) => (
                  <div className="flex items-center gap-4" key={label}>
                    <span className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="flex-1 text-sm font-semibold">{label}</span>
                    <CheckCircle2 className="size-4 text-success" />
                  </div>
                ))}
                <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-950 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100">
                  <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                  <p className="text-xs leading-5">
                    Results are decision support, not a diagnosis. A clinician
                    should interpret symptoms in context.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <section className="scroll-mt-20 py-16 sm:py-24" id="features">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Built for responsible decisions
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Clinical intelligence without the black box.
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Every layer is designed to separate prediction, explanation,
            severity, and professional interpretation.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card className="group transition-transform hover:-translate-y-1" key={feature.title}>
                <CardHeader>
                  <div className="mb-3 flex size-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700 transition-colors group-hover:bg-primary group-hover:text-primary-foreground dark:bg-blue-950 dark:text-blue-300">
                    <Icon aria-hidden="true" className="size-5" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      </section>

      <section className="scroll-mt-20 py-16 sm:py-24" id="workflow">
        <div className="rounded-xl bg-slate-950 px-6 py-12 text-white sm:px-10 lg:px-14">
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                A calm, guided workflow
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
                From symptoms to a clearer conversation.
              </h2>
              <p className="mt-4 leading-7 text-slate-300">
                The experience keeps one decision in focus at a time, then
                preserves the full assessment for review.
              </p>
            </div>
            <ol className="grid gap-4">
              {workflow.map(([number, title, description]) => (
                <li
                  className="grid gap-4 rounded-lg border border-white/10 bg-white/5 p-5 sm:grid-cols-[3rem_1fr]"
                  key={number}
                >
                  <span className="font-display text-xl font-bold text-cyan-300">
                    {number}
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-semibold">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-300">
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="scroll-mt-20 py-16 sm:py-24" id="safety">
        <div className="grid gap-8 rounded-xl border border-blue-200 bg-blue-50 p-7 dark:border-blue-900 dark:bg-blue-950 sm:p-10 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <div className="flex size-14 items-center justify-center rounded-xl bg-blue-600 text-white">
            <ShieldCheck aria-hidden="true" className="size-7" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold">
              Safety is a product feature.
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Emergency rules are deterministic and independent from both ML
              inference and the LLM. Never use MediAI Pro instead of emergency
              services.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/auth/register">Create secure account</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
