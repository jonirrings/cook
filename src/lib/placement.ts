import { createServerFn } from '@tanstack/solid-start'
// we should get CloudFlare placement info in this file
export const getServerTime = createServerFn().handler(async () => {
  // This runs only on the server
  return new Date().toISOString()
})
