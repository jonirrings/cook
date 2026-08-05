import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/solid-router'

import { TanStackRouterDevtools } from '@tanstack/solid-router-devtools'

import '@fontsource/inter/400.css'

import { HydrationScript } from 'solid-js/web'
import { Suspense } from 'solid-js'

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
      { title: '今晚吃什么' },
      { name: 'author', content: 'Jonir Rings' },
      { name: 'description', content: '解决每天三大烦恼之一的晚上吃什么' },
      { name: 'theme-color', content: '#B12A34' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
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
          <TanStackRouterDevtools />
        </Suspense>
        <Scripts />
      </body>
    </html>
  )
}
