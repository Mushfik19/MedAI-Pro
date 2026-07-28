import { zodResolver } from "@hookform/resolvers/zod"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Form, FormTextField } from "@/components/forms"
import { Button } from "@/components/ui/button"

const profileSchema = z.object({
  displayName: z.string().trim().min(2, "Enter at least two characters."),
})

type ProfileForm = z.infer<typeof profileSchema>

function TestForm({ onSubmit }: { onSubmit: (value: ProfileForm) => void }) {
  const form = useForm<ProfileForm>({
    defaultValues: { displayName: "" },
    resolver: zodResolver(profileSchema),
  })

  return (
    <Form {...form}>
      <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
        <FormTextField<ProfileForm>
          label="Display name"
          name="displayName"
          required
        />
        <Button className="mt-4" type="submit">
          Save
        </Button>
      </form>
    </Form>
  )
}

describe("FormTextField", () => {
  it("associates validation feedback and submits valid values", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<TestForm onSubmit={onSubmit} />)

    await user.click(screen.getByRole("button", { name: "Save" }))
    const input = screen.getByRole("textbox", { name: /Display name/ })

    expect(
      await screen.findByText("Enter at least two characters."),
    ).toBeInTheDocument()
    expect(input).toHaveAttribute("aria-invalid", "true")

    await user.type(input, "Mina")
    await user.click(screen.getByRole("button", { name: "Save" }))

    expect(onSubmit).toHaveBeenCalledWith(
      { displayName: "Mina" },
      expect.anything(),
    )
  })
})
