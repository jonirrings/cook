import {createFileRoute} from '@tanstack/solid-router'

export const Route = createFileRoute('/recipes/')({
    component: RouteComponent,
})

function RouteComponent() {
    return <div>Hello "/recipes/"!</div>
}
