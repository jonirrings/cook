import {createFileRoute} from "@tanstack/solid-router";

export const Route = createFileRoute('/recipes/$id')({
 component: Recipe
})

function Recipe(){
    return <>WIP Recipe</>
}