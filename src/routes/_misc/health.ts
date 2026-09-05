// routes/health.ts
import { createFileRoute } from '@tanstack/solid-router'
import db from '~/db'

export const Route = createFileRoute('/_misc/health')({
  server: {
    handlers: {
      GET: async () => {
        const checks = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          database: await checkDatabase(),
          version: process.env.npm_package_version,
        }

        return Response.json(checks)
      },
    },
  },
})

async function checkDatabase() {
  try {
    const start = performance.now()
    await db.run('SELECT 1')
    const latencyMs = performance.now() - start
    return { status: 'connected', latency: latencyMs }
  } catch (error) {
    return { status: 'error', error: (error as any).message }
  }
}
