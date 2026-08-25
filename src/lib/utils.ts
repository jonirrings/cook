import { clsx } from 'clsx'
import type { ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import {
  createClientOnlyFn,
  createIsomorphicFn,
  createServerOnlyFn,
} from '@tanstack/solid-start'
import pkg from '../../package.json'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const logMessage = createIsomorphicFn()
  .server((msg) => console.log(`[SERVER]: ${msg}`))
  .client((msg) => console.log(`[CLIENT]: ${msg}`))

export const formatServerTime = createServerOnlyFn(
  (t: Date | string | number) => new Date(t).toISOString(),
)

export const formatClientTime = createClientOnlyFn(
  (t: Date | string | number) => new Date(t).toISOString(),
)

/**
 * get the server version and git commit digest
 * fixme: use build json instead
 */
export const getServerVersion = createServerOnlyFn(() => pkg.version)
