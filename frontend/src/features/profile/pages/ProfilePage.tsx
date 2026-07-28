import { zodResolver } from "@hookform/resolvers/zod"
import { Mail, MapPin, Phone, ShieldCheck, UserRound } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Form, FormSelectField, FormTextField } from "@/components/forms"
import { PageHeader } from "@/components/data-display/PageHeader"
import { ErrorState, LoadingState } from "@/components/feedback"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  useProfileQuery,
  useUpdateProfileMutation,
} from "@/features/profile/api/profile.hooks"
import {
  profileFormSchema,
  type ProfileFormValues,
} from "@/features/profile/api/profile.schemas"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { ApiError } from "@/lib/api"
import { applyApiFormErrors } from "@/lib/api/applyFormErrors"
import { getInitials } from "@/lib/formatters/name"

const emptyProfile: ProfileFormValues = {
  city: "",
  dateOfBirth: "",
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  sexAtBirth: "PREFER_NOT_TO_SAY",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
}

export function ProfilePage(): React.JSX.Element {
  useDocumentTitle("Profile")
  const profileQuery = useProfileQuery()
  const updateMutation = useUpdateProfileMutation()
  const form = useForm<ProfileFormValues>({
    defaultValues: emptyProfile,
    resolver: zodResolver(profileFormSchema),
  })

  useEffect(() => {
    if (!profileQuery.data) {
      return
    }
    form.reset({
      city: profileQuery.data.city,
      dateOfBirth: profileQuery.data.date_of_birth,
      email: profileQuery.data.email,
      firstName: profileQuery.data.first_name,
      lastName: profileQuery.data.last_name,
      phone: profileQuery.data.phone,
      sexAtBirth: profileQuery.data.sex_at_birth,
      timezone: profileQuery.data.timezone,
    })
  }, [form, profileQuery.data])

  const saveProfile = async (values: ProfileFormValues): Promise<void> => {
    try {
      const profile = await updateMutation.mutateAsync(values)
      form.reset({
        city: profile.city,
        dateOfBirth: profile.date_of_birth,
        email: profile.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        phone: profile.phone,
        sexAtBirth: profile.sex_at_birth,
        timezone: profile.timezone,
      })
      toast.success("Profile updated.")
    } catch (error) {
      if (
        !applyApiFormErrors(error, form.setError, {
          date_of_birth: "dateOfBirth",
          first_name: "firstName",
          last_name: "lastName",
          sex_at_birth: "sexAtBirth",
        })
      ) {
        toast.error(error instanceof ApiError ? error.message : "Unable to update your profile.")
      }
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          profileQuery.data?.identity_verified ? (
            <Badge variant="success">
              <ShieldCheck className="size-3.5" />
              Identity verified
            </Badge>
          ) : null
        }
        description="Keep your identity and contact details accurate so clinical reports reach the right person."
        eyebrow="Account"
        title="Personal profile"
      />

      {profileQuery.isLoading ? <LoadingState label="Loading your profile" /> : null}
      {profileQuery.isError ? (
        <ErrorState
          description={
            profileQuery.error instanceof ApiError
              ? profileQuery.error.message
              : "Your profile could not be loaded."
          }
          onRetry={() => profileQuery.refetch()}
          requestId={
            profileQuery.error instanceof ApiError
              ? profileQuery.error.requestId
              : undefined
          }
          title="Profile unavailable"
        />
      ) : null}

      {profileQuery.data ? (
        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <Card className="self-start">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <Avatar className="size-24 border-4 border-background shadow-lg ring-1 ring-primary/20">
                <AvatarFallback className="bg-primary/10 text-2xl font-black text-primary">
                  {getInitials(
                    `${profileQuery.data.first_name} ${profileQuery.data.last_name}`,
                  )}
                </AvatarFallback>
              </Avatar>
              <h2 className="mt-4 text-xl font-black">
                {profileQuery.data.first_name} {profileQuery.data.last_name}
              </h2>
              <p className="text-sm text-muted-foreground">Patient account</p>
              <Badge className="mt-3 font-mono" variant="secondary">
                {profileQuery.data.user_id}
              </Badge>
              <Separator className="my-5" />
              <div className="w-full space-y-3 text-left text-sm">
                <div className="flex items-center gap-3">
                  <Mail className="size-4 text-primary" />
                  <span className="truncate text-muted-foreground">
                    {profileQuery.data.email}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="size-4 text-primary" />
                  <span className="text-muted-foreground">{profileQuery.data.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="size-4 text-primary" />
                  <span className="text-muted-foreground">{profileQuery.data.city}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <UserRound className="size-5" />
                </span>
                <div>
                  <CardTitle>Personal information</CardTitle>
                  <CardDescription>
                    Validated fields are sent securely to your profile API.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form className="space-y-6" onSubmit={form.handleSubmit(saveProfile)}>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormTextField autoComplete="given-name" label="First name" name="firstName" />
                    <FormTextField autoComplete="family-name" label="Last name" name="lastName" />
                    <FormTextField
                      autoComplete="email"
                      disabled
                      label="Email address"
                      name="email"
                      type="email"
                    />
                    <FormTextField
                      autoComplete="tel"
                      label="Phone number"
                      name="phone"
                      type="tel"
                    />
                    <FormTextField label="Date of birth" name="dateOfBirth" type="date" />
                    <FormSelectField
                      label="Sex at birth"
                      name="sexAtBirth"
                      options={[
                        { label: "Female", value: "FEMALE" },
                        { label: "Male", value: "MALE" },
                        { label: "Intersex", value: "INTERSEX" },
                        { label: "Prefer not to say", value: "PREFER_NOT_TO_SAY" },
                      ]}
                      placeholder="Select sex at birth"
                    />
                    <FormTextField autoComplete="address-level2" label="City" name="city" />
                    <FormSelectField
                      label="Timezone"
                      name="timezone"
                      options={[
                        { label: "Pacific Time", value: "America/Los_Angeles" },
                        { label: "Eastern Time", value: "America/New_York" },
                        { label: "Bangladesh Time", value: "Asia/Dhaka" },
                        { label: "Central European Time", value: "Europe/Berlin" },
                      ]}
                      placeholder="Select timezone"
                    />
                  </div>
                  <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" onClick={() => form.reset()}>
                      Reset changes
                    </Button>
                    <Button
                      disabled={!form.formState.isDirty}
                      loading={updateMutation.isPending}
                      type="submit"
                    >
                      Save profile
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
