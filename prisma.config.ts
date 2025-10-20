import { defineConfig } from '@prisma/cli'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  seed: 'tsx prisma/seed.ts',
})
