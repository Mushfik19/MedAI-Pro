import { LogIn } from "lucide-react"
import { Link } from "react-router-dom"
import { EmptyState } from "@/components/feedback/EmptyState"
import { Button } from "@/components/ui/button"

export function UnauthorizedPage(): React.JSX.Element {
  return (
    <EmptyState
      action={
        <Button asChild>
          <Link to="/auth/login">Continue to sign in</Link>
        </Button>
      }
      description="Sign in is required before MediAI Pro can display protected information."
      icon={LogIn}
      title="Authentication required"
    />
  )
}
