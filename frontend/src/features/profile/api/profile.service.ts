import {
  profileFormSchema,
  profileSchema,
  type ProfileFormValues,
} from "@/features/profile/api/profile.schemas"
import { apiClient } from "@/lib/api"
import { createEnvelopeSchema, parseResponse } from "@/lib/api/parseResponse"

export const profileService = {
  async get() {
    const response = await apiClient.get("/users/me")
    return parseResponse(createEnvelopeSchema(profileSchema), response.data).data
  },

  async update(values: ProfileFormValues) {
    const validValues = profileFormSchema.parse(values)
    const response = await apiClient.patch("/users/me/profile", {
      city: validValues.city,
      date_of_birth: validValues.dateOfBirth,
      first_name: validValues.firstName,
      last_name: validValues.lastName,
      phone: validValues.phone,
      sex_at_birth: validValues.sexAtBirth,
      timezone: validValues.timezone,
    })
    return parseResponse(createEnvelopeSchema(profileSchema), response.data).data
  },
}
