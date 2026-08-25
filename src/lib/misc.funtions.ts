import { createServerFn } from '@tanstack/solid-start'
import { staticFunctionMiddleware } from '@tanstack/start-static-server-functions'
import { getServerVersion } from '~/lib/utils.ts'

export const getServerVersionFn = createServerFn({ method: 'GET' })
  .middleware([staticFunctionMiddleware])
  .handler(getServerVersion)
