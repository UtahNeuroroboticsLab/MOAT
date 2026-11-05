// src/global.d.ts
declare module '*.css';
declare module '*.scss';
declare module '*.sass';
declare module '*.less';

interface ImportMetaEnv {
  readonly BASE_URL: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
