import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight, ShieldCheck } from "lucide-react"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { z } from "zod"
import { useLoginMutation } from "@/features/auth/api/auth.mutations"
import { Form, FormTextField } from "@/components/forms"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { ApiError } from "@/lib/api"
import { applyApiFormErrors } from "@/lib/api/applyFormErrors"
import { useAuth } from "@/state/auth/useAuth"

const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Password must contain at least eight characters."),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage(): React.JSX.Element {
  useDocumentTitle("Sign in")
  const navigate = useNavigate()
  const { establishSession } = useAuth()
  const loginMutation = useLoginMutation()
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const openSession = (
    result: Awaited<ReturnType<typeof loginMutation.mutateAsync>>,
  ): void => {
    establishSession(result.session, result.accessToken)
    const role = result.session.user.role
    navigate(role === "ADMIN" ? "/admin/dashboard" : role === "DOCTOR" ? "/doctor" : "/dashboard", {
      replace: true,
    })
    toast.success("Signed in securely.")
  }

  const submit = async (values: LoginForm): Promise<void> => {
    try {
      const result = await loginMutation.mutateAsync({
        email: values.email,
        password: values.password,
      })
      openSession(result)
    } catch (error) {
      if (!applyApiFormErrors(error, form.setError)) {
        toast.error(
          error instanceof ApiError ? error.message : "Unable to sign in. Please try again.",
        )
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>
          Sign in to continue to your secure MediAI Pro workspace.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-5" noValidate onSubmit={form.handleSubmit(submit)}>
            <FormTextField<LoginForm>
              autoComplete="email"
              label="Email address"
              name="email"
              required
              type="email"
            />
            <FormTextField<LoginForm>
              autoComplete="current-password"
              label="Password"
              name="password"
              required
              type="password"
            />
            <div className="flex justify-end">
              <Button asChild variant="link">
                <Link to="/auth/forgot-password">Forgot password?</Link>
              </Button>
            </div>
            <Button
              className="w-full"
              loading={loginMutation.isPending}
              type="submit"
            >
              Sign in securely
              <ArrowRight aria-hidden="true" />
            </Button>
          </form>
        </Form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to MediAI Pro?{" "}
          <Link className="font-semibold text-primary hover:underline" to="/auth/register">
            Create an account
          </Link>
        </p>
        <div className="mt-5 flex items-start gap-2 rounded-md bg-muted p-3 text-xs leading-5 text-muted-foreground">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          Access is protected by short-lived access tokens and a secure refresh session.
        </div>
      </CardContent>
    </Card>
  )
}
