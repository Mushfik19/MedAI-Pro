import { ShieldX } from "lucide-react"
import { Link } from "react-router-dom"
import { EmptyState } from "@/components/feedback/EmptyState"
import { Button } from "@/components/ui/button"

export function ForbiddenPage(): React.JSX.Element {
  return (
    <EmptyState
      action={
        <Button asChild variant="outline">
          <Link to="/">Return to a safe page</Link>
        </Button>
      }
      description="Your account does not have permission to view this resource. Access attempts to sensitive records may be audited."
      icon={ShieldX}
      title="Access denied"
    />
  )
}
