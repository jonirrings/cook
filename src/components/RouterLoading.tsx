import { useRouterState } from '@tanstack/solid-router'
import { createEffect, createSignal } from 'solid-js'
import { cn } from '~/lib/utils.ts'
import { Spinner } from '~/components/Spinner.tsx'

export function RouterLoading() {
  const [showNavigationSpinner, setShowNavigationSpinner] = createSignal(false)
  const isNavigating = useRouterState({
    select: (s) => s.isLoading || s.status === 'pending',
  })
  createEffect((prev?: number) => {
    if (prev) {
      clearTimeout(prev)
    }
    if (!isNavigating()) {
      setShowNavigationSpinner(false)
      return
    }
    return window.setTimeout(() => {
      setShowNavigationSpinner(true)
    }, 1000)
  })
  return (
    <div
      aria-hidden="true"
      class={cn(
        'pointer-events-none fixed top-0 left-0 z-99999999 h-[320px] w-full select-none',
      )}
    >
      <div
        class={cn(
          'absolute top-0 w-full h-80 rounded-[100%] bg-amber-500/30 blur-3xl transition-all duration-500 dark:bg-sky-400/25',
          showNavigationSpinner()
            ? '-translate-y-1/2 opacity-100'
            : '-translate-y-full opacity-0',
        )}
      />
      <div
        class={cn(
          'absolute top-6 left-1/2 -translate-x-1/2 rounded-full bg-white/75 p-2 shadow-lg backdrop-blur-lg transition-all duration-300 dark:bg-slate-900/40',
          showNavigationSpinner()
            ? 'translate-y-0 opacity-100'
            : '-translate-y-6 opacity-0',
        )}
      >
        {isNavigating() && showNavigationSpinner() ? (
          <Spinner className="text-4xl" />
        ) : null}
      </div>
    </div>
  )
}
