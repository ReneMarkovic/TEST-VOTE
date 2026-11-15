/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LIVE_USERS_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
