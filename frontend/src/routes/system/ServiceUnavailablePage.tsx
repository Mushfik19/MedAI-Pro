import { CloudOff } from "lucide-react"
import { EmptyState } from "@/components/feedback/EmptyState"
import { Button } from "@/components/ui/button"

export function ServiceUnavailablePage(): React.JSX.Element {
  return (
    <EmptyState
      action={
        <Button onClick={() => window.location.reload()} variant="outline">
          Try again
        </Button>
      }
      description="This capability is temporarily unavailable. Do not rely on MediAI Pro for emergency care."
      icon={CloudOff}
      title="Service temporarily unavailable"
    />
  )
}
