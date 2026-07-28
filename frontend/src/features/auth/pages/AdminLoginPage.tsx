import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight, ShieldCheck } from "lucide-react"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { z } from "zod"
import { Form, FormTextField } from "@/components/forms"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAdminLoginMutation } from "@/features/auth/api/auth.mutations"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { ApiError } from "@/lib/api"
import { applyApiFormErrors } from "@/lib/api/applyFormErrors"
import { useAuth } from "@/state/auth/useAuth"

const adminLoginSchema = z.object({
  username: z.string().trim().min(3, "Enter your administrator username."),
  password: z.string().min(1, "Enter your password."),
})

type AdminLoginForm = z.infer<typeof adminLoginSchema>

export function AdminLoginPage(): React.JSX.Element {
  useDocumentTitle("Administrator sign in")
  const navigate = useNavigate()
  const { establishSession } = useAuth()
  const loginMutation = useAdminLoginMutation()
  const form = useForm<AdminLoginForm>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { username: "", password: "" },
  })

  const submit = async (values: AdminLoginForm): Promise<void> => {
    try {
      const result = await loginMutation.mutateAsync(values)
      if (result.session.user.role !== "ADMIN") {
        throw new Error("Administrator access is required.")
      }
      establishSession(result.session, result.accessToken)
      navigate("/admin/dashboard", { replace: true })
      toast.success("Administrator session established.")
    } catch (error) {
      if (!applyApiFormErrors(error, form.setError)) {
        toast.error(
          error instanceof ApiError
            ? error.message
            : "Unable to authenticate this administrator account.",
        )
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ShieldCheck aria-hidden="true" className="size-6" />
        </div>
        <CardTitle className="text-2xl">Administrator access</CardTitle>
        <CardDescription>
          Sign in with your privileged administrator credentials.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-5" noValidate onSubmit={form.handleSubmit(submit)}>
            <FormTextField<AdminLoginForm>
              autoComplete="username"
              label="Username"
              name="username"
              required
            />
            <FormTextField<AdminLoginForm>
              autoComplete="current-password"
              label="Password"
              name="password"
              required
              type="password"
            />
            <Button
              className="w-full"
              loading={loginMutation.isPending}
              type="submit"
            >
              Sign in as administrator
              <ArrowRight aria-hidden="true" />
            </Button>
          </form>
        </Form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Not an administrator?{" "}
          <Link className="font-semibold text-primary hover:underline" to="/auth/login">
            Return to user sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
