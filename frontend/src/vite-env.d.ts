/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_APP_ENV?: "local" | "test" | "staging" | "production"
  readonly VITE_ENABLE_API_LOGGING?: "true" | "false"
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
