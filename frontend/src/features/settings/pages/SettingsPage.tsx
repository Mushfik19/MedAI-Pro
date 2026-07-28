import { Bell, Download, Laptop, LockKeyhole, LogOut, Moon, Smartphone, Sun, Trash2 } from "lucide-react"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { PageHeader } from "@/components/data-display/PageHeader"
import { ErrorState, LoadingState } from "@/components/feedback"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useLogoutMutation } from "@/features/auth/api/auth.mutations"
import {
  useDataExportMutation,
  useDeletionRequestMutation,
  useSettingsQuery,
  useUpdateSettingsMutation,
} from "@/features/settings/api/settings.hooks"
import type { Settings } from "@/features/settings/api/settings.schemas"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { ApiError } from "@/lib/api"
import { cn } from "@/lib/utils/cn"
import { useAuth } from "@/state/auth/useAuth"
import type { ThemePreference } from "@/state/theme/theme.types"
import { useTheme } from "@/state/theme/useTheme"

const themeOptions: Array<{
  description: string
  icon: typeof Sun
  label: string
  value: ThemePreference
}> = [
  { description: "Always use a light interface", icon: Sun, label: "Light", value: "light" },
  { description: "Reduce brightness in low light", icon: Moon, label: "Dark", value: "dark" },
  { description: "Match this device automatically", icon: Laptop, label: "System", value: "system" },
]

const notificationOptions = [
  {
    description: "Immediate notification when a report contains a red flag.",
    key: "clinical_alerts",
    label: "Clinical safety alerts",
  },
  {
    description: "A concise summary of prediction activity each Monday.",
    key: "weekly_digest",
    label: "Weekly health digest",
  },
  {
    description: "Notify me when a prediction report or export is complete.",
    key: "report_ready",
    label: "Report-ready alerts",
  },
  {
    description: "Occasional updates about new MediAI capabilities.",
    key: "product_updates",
    label: "Product updates",
  },
] as const

type NotificationKey = keyof Settings["notifications"]

export function SettingsPage(): React.JSX.Element {
  useDocumentTitle("Settings")
  const { theme, setTheme } = useTheme()
  const { clearSession } = useAuth()
  const navigate = useNavigate()
  const settingsQuery = useSettingsQuery()
  const updateMutation = useUpdateSettingsMutation()
  const exportMutation = useDataExportMutation()
  const deletionMutation = useDeletionRequestMutation()
  const logoutMutation = useLogoutMutation()

  useEffect(() => {
    if (settingsQuery.data?.settings.theme) {
      setTheme(settingsQuery.data.settings.theme)
    }
  }, [setTheme, settingsQuery.data?.settings.theme])

  const updateTheme = async (nextTheme: ThemePreference): Promise<void> => {
    const previousTheme = theme
    setTheme(nextTheme)
    try {
      await updateMutation.mutateAsync({ theme: nextTheme })
    } catch (error) {
      setTheme(previousTheme)
      toast.error(error instanceof ApiError ? error.message : "Unable to save your theme.")
    }
  }

  const updateNotification = async (
    key: NotificationKey,
    checked: boolean,
  ): Promise<void> => {
    if (!settingsQuery.data) {
      return
    }
    try {
      await updateMutation.mutateAsync({
        notifications: {
          ...settingsQuery.data.settings.notifications,
          [key]: checked,
        },
      })
      toast.success("Notification preference updated.")
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Unable to update notifications.",
      )
    }
  }

  const signOut = async (): Promise<void> => {
    try {
      await logoutMutation.mutateAsync()
    } finally {
      clearSession()
      navigate("/auth/login", { replace: true })
    }
  }

  const requestExport = async (): Promise<void> => {
    try {
      await exportMutation.mutateAsync()
      toast.success("Secure export request submitted.")
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unable to request an export.")
    }
  }

  const requestDeletion = async (): Promise<void> => {
    try {
      await deletionMutation.mutateAsync()
      toast.success("Account deletion request submitted.")
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Unable to request account deletion.",
      )
    }
  }

  if (settingsQuery.isLoading) {
    return <LoadingState label="Loading account settings" />
  }

  if (settingsQuery.isError || !settingsQuery.data) {
    return (
      <ErrorState
        description={
          settingsQuery.error instanceof ApiError
            ? settingsQuery.error.message
            : "Your settings could not be loaded."
        }
        onRetry={() => settingsQuery.refetch()}
        requestId={
          settingsQuery.error instanceof ApiError
            ? settingsQuery.error.requestId
            : undefined
        }
        title="Settings unavailable"
      />
    )
  }

  const { notifications } = settingsQuery.data.settings
  const currentSession = settingsQuery.data.sessions.find((session) => session.is_current)

  return (
    <div className="space-y-6">
      <PageHeader
        description="Control how MediAI looks, communicates with you, and protects your health data."
        eyebrow="Preferences & privacy"
        title="Settings"
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Choose a theme that works comfortably across your devices.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {themeOptions.map((option) => {
              const Icon = option.icon
              return (
                <button
                  aria-pressed={theme === option.value}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    theme === option.value
                      ? "border-primary bg-primary/8"
                      : "border-border bg-background/60 hover:border-primary/30",
                  )}
                  key={option.value}
                  onClick={() => updateTheme(option.value)}
                  type="button"
                >
                  <span
                    className={cn(
                      "grid size-10 place-items-center rounded-xl",
                      theme === option.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <p className="mt-3 font-bold">{option.label}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {option.description}
                  </p>
                </button>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Security</CardTitle>
                <CardDescription>Authentication and active session status.</CardDescription>
              </div>
              <Badge variant="success">Protected</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-border/75 p-4">
              <span className="grid size-10 place-items-center rounded-xl bg-success/10 text-success">
                <LockKeyhole className="size-5" />
              </span>
              <div>
                <p className="font-semibold">Two-factor authentication</p>
                <p className="text-sm text-muted-foreground">
                  Authenticator app is{" "}
                  {settingsQuery.data.settings.mfa_enabled ? "enabled" : "not enabled"}.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-border/75 p-4">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Smartphone className="size-5" />
              </span>
              <div>
                <p className="font-semibold">Current session</p>
                <p className="text-sm text-muted-foreground">
                  {currentSession
                    ? `${currentSession.device_name} · ${
                        currentSession.location_label ?? "Location unavailable"
                      }`
                    : "Current session details unavailable"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Bell className="size-5 text-primary" />
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Clinical safety alerts remain prioritized.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-x-10 md:grid-cols-2">
          {notificationOptions.map((item) => (
            <div className="flex gap-3 border-b border-border/60 py-4" key={item.key}>
              <Checkbox
                checked={notifications[item.key]}
                id={item.key}
                onCheckedChange={(checked) =>
                  updateNotification(item.key, checked === true)
                }
              />
              <div className="space-y-1">
                <Label className="cursor-pointer font-semibold" htmlFor={item.key}>
                  {item.label}
                </Label>
                <p className="text-sm leading-5 text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data and account</CardTitle>
          <CardDescription>Exercise your privacy rights or end the current session.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="font-semibold">Export my data</p>
              <p className="text-sm text-muted-foreground">
                Request a secure archive of your profile and assessment history.
              </p>
            </div>
            <Button loading={exportMutation.isPending} onClick={requestExport} variant="outline">
              <Download className="size-4" />
              Request export
            </Button>
          </div>
          <Separator />
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="font-semibold">Sign out of MediAI</p>
              <p className="text-sm text-muted-foreground">End this session on the current device.</p>
            </div>
            <Button loading={logoutMutation.isPending} onClick={signOut} variant="outline">
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
          <Separator />
          <Alert variant="danger">
            <Trash2 className="size-4" />
            <AlertTitle>Delete account</AlertTitle>
            <AlertDescription>
              This schedules eligible personal data for deletion after the required retention period.
            </AlertDescription>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="mt-4" size="sm" variant="destructive">
                  Delete my account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request permanent account deletion?</DialogTitle>
                  <DialogDescription>
                    Clinical records subject to legal retention may remain in a restricted archive.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button
                      loading={deletionMutation.isPending}
                      onClick={requestDeletion}
                      variant="destructive"
                    >
                      Confirm request
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
