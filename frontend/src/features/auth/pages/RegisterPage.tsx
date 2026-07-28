import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight } from "lucide-react"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { z } from "zod"
import { applicationConfig } from "@/app/applicationConfig"
import { Form, FormCheckboxField, FormTextField } from "@/components/forms"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useRegistrationMutation } from "@/features/auth/api/auth.mutations"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { ApiError } from "@/lib/api"
import { applyApiFormErrors } from "@/lib/api/applyFormErrors"

const registrationSchema = z
  .object({
    displayName: z.string().trim().min(2, "Enter your full name."),
    email: z.email("Enter a valid email address."),
    password: z
      .string()
      .min(10, "Use at least ten characters.")
      .regex(/[A-Z]/, "Include an uppercase letter.")
      .regex(/[0-9]/, "Include a number."),
    confirmPassword: z.string(),
    consent: z
      .boolean()
      .refine((accepted) => accepted, "Review and accept the informed-use terms."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  })

type RegistrationForm = z.infer<typeof registrationSchema>

export function RegisterPage(): React.JSX.Element {
  useDocumentTitle("Create account")
  const navigate = useNavigate()
  const registrationMutation = useRegistrationMutation()
  const consentConfigRequired =
    applicationConfig.environment === "staging" ||
    applicationConfig.environment === "production"
  const form = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
      consent: false,
    },
  })

  const submit = async (values: RegistrationForm): Promise<void> => {
    if (consentConfigRequired && !applicationConfig.informedUseConsentId) {
      toast.error("Registration is temporarily unavailable because consent is not configured.")
      return
    }
    try {
      await registrationMutation.mutateAsync({
        consent_document_ids: applicationConfig.informedUseConsentId
          ? [applicationConfig.informedUseConsentId]
          : [],
        display_name: values.displayName,
        email: values.email,
        password: values.password,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })
      toast.success("Account created. You can now sign in.")
      navigate("/auth/login", { replace: true })
    } catch (error) {
      if (
        !applyApiFormErrors(error, form.setError, {
          display_name: "displayName",
        })
      ) {
        toast.error(
          error instanceof ApiError
            ? error.message
            : "Unable to create your account. Please try again.",
        )
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>
          Start with a private, secure patient workspace.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-5" noValidate onSubmit={form.handleSubmit(submit)}>
            <FormTextField<RegistrationForm>
              autoComplete="name"
              label="Full name"
              name="displayName"
              required
            />
            <FormTextField<RegistrationForm>
              autoComplete="email"
              label="Email address"
              name="email"
              required
              type="email"
            />
            <FormTextField<RegistrationForm>
              autoComplete="new-password"
              description="Use at least ten characters, one uppercase letter, and one number."
              label="Password"
              name="password"
              required
              type="password"
            />
            <FormTextField<RegistrationForm>
              autoComplete="new-password"
              label="Confirm password"
              name="confirmPassword"
              required
              type="password"
            />
            <FormCheckboxField<RegistrationForm>
              description="I understand that MediAI Pro provides decision support, not diagnosis or emergency care."
              label="Accept informed-use terms"
              name="consent"
            />
            <Button className="w-full" loading={registrationMutation.isPending} type="submit">
              Create secure account
              <ArrowRight aria-hidden="true" />
            </Button>
          </form>
        </Form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already registered?{" "}
          <Link className="font-semibold text-primary hover:underline" to="/auth/login">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
