import {createFileRoute, notFound, redirect} from '@tanstack/solid-router'
import {Route as RecipeRoute} from './recipes/$id'
import {getRandRecipe} from "~/lib/recipes.functions.ts";

export const Route = createFileRoute('/lucky')({
    loader:async ()=>{
        const randRecipe = await getRandRecipe();
        if(randRecipe){
            throw redirect({ to: RecipeRoute.fullPath,params:{id:`${randRecipe.id}`} })
        }else {
            throw notFound();
        }
    },
    component: RouteComponent,
})

function RouteComponent() {
    return <div>Hello "/lucky"!</div>
}
