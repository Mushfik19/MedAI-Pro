import { Bell, UserRound } from "lucide-react"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/state/auth/useAuth"

export function AuthenticatedHeaderActions(): React.JSX.Element {
  const { user } = useAuth()

  return (
    <>
      <Badge className="hidden sm:inline-flex" variant="outline">
        Live API
      </Badge>
      <Button asChild size="icon" variant="ghost">
        <Link aria-label="Notification settings" to="/settings">
          <Bell aria-hidden="true" />
        </Link>
      </Button>
      <Button asChild className="rounded-full" size="icon" variant="secondary">
        <Link
          aria-label={user ? `Account: ${user.displayName}` : "Account"}
          to={user?.role === "PATIENT" ? "/profile" : "/auth/login"}
        >
          <UserRound aria-hidden="true" />
        </Link>
      </Button>
    </>
  )
}
