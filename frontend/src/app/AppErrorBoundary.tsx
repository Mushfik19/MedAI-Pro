import { Component, type ErrorInfo, type ReactNode } from "react"
import { ErrorState } from "@/components/feedback/ErrorState"

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  public override state: AppErrorBoundaryState = { hasError: false }

  public static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true }
  }

  public override componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error("Uncaught application error", error, info.componentStack)
    }
  }

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-svh items-center bg-background p-4">
          <div className="mx-auto w-full max-w-3xl">
            <ErrorState
              description="The application could not start safely. Reload the page, and contact support if the problem continues."
              onRetry={() => window.location.reload()}
              title="MediAI Pro could not start"
            />
          </div>
        </main>
      )
    }

    return this.props.children
  }
}
