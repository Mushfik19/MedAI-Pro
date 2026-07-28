import { Eye, Search, ShieldBan, Trash2, UserCheck } from "lucide-react"
import { useDeferredValue, useState } from "react"
import { toast } from "sonner"
import { PageHeader } from "@/components/data-display/PageHeader"
import { ErrorState, LoadingState } from "@/components/feedback"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  useAdminDeleteUserMutation,
  useAdminUsersQuery,
  useAdminUserStatusMutation,
} from "@/features/admin/api/admin.hooks"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { formatDateTime } from "@/lib/formatters/dateTime"

export function AdminUsersPage(): React.JSX.Element {
  useDocumentTitle("User management")
  const [search, setSearch] = useState("")
  const [role, setRole] = useState("all")
  const [status, setStatus] = useState("all")
  const deferredSearch = useDeferredValue(search.trim())
  const users = useAdminUsersQuery({
    ...(deferredSearch ? { search: deferredSearch } : {}),
    ...(role !== "all" ? { role } : {}),
    ...(status !== "all" ? { status } : {}),
  })
  const statusMutation = useAdminUserStatusMutation()
  const deleteMutation = useAdminDeleteUserMutation()

  const remove = async (id: string, label: string): Promise<void> => {
    if (!window.confirm(`Permanently delete ${label}? This action cannot be undone.`)) return
    try {
      await deleteMutation.mutateAsync(id)
      toast.success("User deleted.")
    } catch {
      toast.error("The user could not be deleted.")
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Search identities, review access, suspend sessions, and remove accounts."
        eyebrow="Identity governance"
        title="User management"
      />
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_13rem_13rem]">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search email or username" value={search}
              onChange={(event) => setSearch(event.target.value)} />
          </label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger><SelectValue placeholder="All roles" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="PATIENT">Users</SelectItem>
              <SelectItem value="DOCTOR">Doctors</SelectItem>
              <SelectItem value="ADMIN">Administrators</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
              <SelectItem value="DEACTIVATED">Deactivated</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      {users.isLoading ? <LoadingState label="Loading users" /> : null}
      {users.isError ? <ErrorState title="Users unavailable" description="User records could not be loaded." onRetry={() => users.refetch()} /> : null}
      <div className="grid gap-3">
        {users.data?.map((user) => (
          <Card key={user.id} className="border-slate-200 shadow-sm">
            <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold">{user.display_name}</p>
                  <Badge variant={user.status === "ACTIVE" ? "success" : "warning"}>{user.status}</Badge>
                  <Badge variant="secondary">{user.role === "PATIENT" ? "USER" : user.role}</Badge>
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">{user.email}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  @{user.username ?? "email-only"} · Registered {formatDateTime(user.created_at)}
                  {user.last_login_at ? ` · Last login ${formatDateTime(user.last_login_at)}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" title="View user details"
                  onClick={() => toast.info(`${user.email} · ${user.role} · ${user.status}`)}>
                  <Eye /> View
                </Button>
                {user.role !== "ADMIN" ? (
                  <>
                    <Button size="sm" variant="outline" onClick={() =>
                      statusMutation.mutate({
                        id: user.id,
                        status: user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
                      })
                    }>
                      {user.status === "ACTIVE" ? <ShieldBan /> : <UserCheck />}
                      {user.status === "ACTIVE" ? "Disable" : "Activate"}
                    </Button>
                    <Button size="sm" variant="destructive"
                      onClick={() => void remove(user.id, user.display_name)}>
                      <Trash2 /> Delete
                    </Button>
                  </>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
