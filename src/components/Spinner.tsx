import { cn } from '~/lib/utils.ts'
import { LoaderCircle } from 'lucide-solid'

interface SpinnerProps {
  className?: string
}
export function Spinner({ className }: SpinnerProps) {
  return (
    <LoaderCircle
      class={cn(
        'animate-spin text-gray-900 dark:text-white text-2xl',
        className,
      )}
      aria-label="Loading"
    />
  )
}
