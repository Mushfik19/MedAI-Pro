import { ArrowLeft, Home } from "lucide-react"
import { Link, useRouteError } from "react-router-dom"
import { ErrorState } from "@/components/feedback/ErrorState"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api/apiError"

export function SystemErrorPage(): React.JSX.Element {
  const error = useRouteError()
  const requestId = error instanceof ApiError ? error.requestId : undefined

  return (
    <ErrorState
      description="The page could not be displayed. Your saved records have not been changed."
      title="Something went wrong"
      {...(requestId ? { requestId } : {})}
    >
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild variant="outline">
          <Link to="/">
            <Home aria-hidden="true" />
            Return home
          </Link>
        </Button>
        <Button onClick={() => window.history.back()} variant="secondary">
          <ArrowLeft aria-hidden="true" />
          Go back
        </Button>
      </div>
    </ErrorState>
  )
}
