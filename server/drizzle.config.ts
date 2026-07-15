import { defineConfig } from 'drizzle-kit'

// Generates SQLite migration files from the schema into ./migrations.
// The generated SQL is applied to D1 via `wrangler d1 migrations apply`.
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './migrations',
  dialect: 'sqlite',
})
