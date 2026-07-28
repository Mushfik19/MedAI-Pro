import { Suspense } from "react"
import { RouterProvider } from "react-router-dom"
import { AppErrorBoundary } from "@/app/AppErrorBoundary"
import { AppProviders } from "@/app/AppProviders"
import { appRouter } from "@/app/router"
import { LoadingState } from "@/components/feedback/LoadingState"

export function App(): React.JSX.Element {
  return (
    <AppErrorBoundary>
      <AppProviders>
        <Suspense fallback={<LoadingState label="Loading MediAI workspace" />}>
          <RouterProvider router={appRouter} />
        </Suspense>
      </AppProviders>
    </AppErrorBoundary>
  )
}
