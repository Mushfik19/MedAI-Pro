import { useEffect } from "react"

const PRODUCT_NAME = "MediAI Pro"

export function useDocumentTitle(title?: string): void {
  useEffect(() => {
    const previousTitle = document.title
    document.title = title ? `${title} | ${PRODUCT_NAME}` : PRODUCT_NAME

    return () => {
      document.title = previousTitle
    }
  }, [title])
}
