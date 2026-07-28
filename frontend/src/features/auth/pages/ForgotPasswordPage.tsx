import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight, Mail } from "lucide-react"
import { useForm } from "react-hook-form"
import { Link } from "react-router-dom"
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
import { usePasswordResetRequestMutation } from "@/features/auth/api/auth.mutations"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { ApiError } from "@/lib/api"

const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email address."),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordPage(): React.JSX.Element {
  useDocumentTitle("Reset password")
  const requestMutation = usePasswordResetRequestMutation()
  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  const submit = async (values: ForgotPasswordForm): Promise<void> => {
    try {
      await requestMutation.mutateAsync({ email: values.email })
      toast.success("If an account exists, a reset email has been sent.")
      form.reset()
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Unable to request a password reset.",
      )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Reset your password</CardTitle>
        <CardDescription>
          We’ll send a one-time reset link to the email address on file.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-5" noValidate onSubmit={form.handleSubmit(submit)}>
            <FormTextField<ForgotPasswordForm>
              autoComplete="email"
              label="Email address"
              name="email"
              required
              type="email"
            />
            <Button className="w-full" loading={requestMutation.isPending} type="submit">
              Send reset email
              <ArrowRight aria-hidden="true" />
            </Button>
          </form>
        </Form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Remembered your password?{" "}
          <Link className="font-semibold text-primary hover:underline" to="/auth/login">
            Sign in
          </Link>
        </p>
        <div className="mt-5 flex items-start gap-2 rounded-md bg-muted p-3 text-xs leading-5 text-muted-foreground">
          <Mail aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          Reset links are time-limited and can only be used once.
        </div>
      </CardContent>
    </Card>
  )
}