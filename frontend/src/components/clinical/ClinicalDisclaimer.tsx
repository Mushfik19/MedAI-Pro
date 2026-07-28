import { ShieldCheck } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function ClinicalDisclaimer(): React.JSX.Element {
  return (
    <Alert variant="info">
      <ShieldCheck aria-hidden="true" />
      <AlertTitle>Clinical decision support, not a diagnosis</AlertTitle>
      <AlertDescription>
        Model predictions are screening support, not confirmed diagnoses. A
        qualified clinician must interpret symptoms and determine appropriate care.
      </AlertDescription>
    </Alert>
  )
}
