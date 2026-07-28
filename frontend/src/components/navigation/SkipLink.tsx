export function SkipLink(): React.JSX.Element {
  return (
    <a
      className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground shadow-lg transition-transform focus:translate-y-0"
      href="#main-content"
    >
      Skip to main content
    </a>
  )
}
