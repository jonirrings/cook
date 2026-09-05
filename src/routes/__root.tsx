/// <reference types="vite/client" /
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/solid-router'

import { TanStackDevtools } from '@tanstack/solid-devtools'
import { SolidQueryDevtoolsPanel } from '@tanstack/solid-query-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/solid-router-devtools'
import { TableDevtoolsPanel } from '@tanstack/solid-table-devtools'

import '@fontsource/inter/400.css'

import { HydrationScript } from 'solid-js/web'
import { Suspense } from 'solid-js'

import { Toaster } from '~/components/ui/sonner'

import styleCss from '../styles.css?url'

export const Route = createRootRouteWithContext()({
  head: () => ({
    links: [
      { rel: 'stylesheet', href: styleCss },
      { rel: 'shortcut icon', href: '/dinner-16.png' },
      { rel: 'apple-touch-icon', href: '/dinner-192.png' },
      { rel: 'manifest', href: '/cook.webmanifest' },
    ],
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: '今晚吃啥' },
      { name: 'author', content: 'Jonir Rings' },
      { name: 'description', content: '解决每天三大烦恼之一的晚上吃啥' },
      { name: 'theme-color', content: '#B12A34' },
    ],
  }),
  shellComponent: RootComponent,
})

function RootComponent() {
  return (
    <html>
      <head>
        <HydrationScript />
        <HeadContent />
      </head>
      <body>
        <Suspense>
          <Outlet />
          <TanStackDevtools
            plugins={[
              {
                name: 'TanStack Table',
                render: <TableDevtoolsPanel />,
              },
              {
                name: 'TanStack Query',
                render: <SolidQueryDevtoolsPanel />,
              },
              {
                name: 'TanStack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        </Suspense>
        <Toaster />
        <Scripts />
      </body>
    </html>
  )
}
