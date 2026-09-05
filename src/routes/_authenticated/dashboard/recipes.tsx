import {createFileRoute} from '@tanstack/solid-router'

export const Route = createFileRoute('/_authenticated/dashboard/recipes')({
    component: RouteComponent,
})

function RouteComponent() {
    return <div>Hello "/_authenticated/dashboard/recipes"!</div>
}
