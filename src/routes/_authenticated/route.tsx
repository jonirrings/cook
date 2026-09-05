import {createFileRoute, Link, Outlet} from '@tanstack/solid-router'
import {Route as DashboardRoute} from './dashboard'
import {Route as RecipesRoute} from './dashboard/recipes'
import {Route as CategoriesRoute} from './dashboard/categories'

export const Route = createFileRoute('/_authenticated')({
    component: RouteComponent,
})

function RouteComponent() {
    return <div>
        <div>
            <div><Link to={DashboardRoute.fullPath}>Dashboard</Link></div>
            <div><Link to={RecipesRoute.fullPath}>Recipes</Link></div>
            <div><Link to={CategoriesRoute.fullPath}>Categories</Link></div>

        </div>
        <div><Outlet/></div>
    </div>
}
