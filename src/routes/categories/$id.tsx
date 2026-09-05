import {createFileRoute} from "@tanstack/solid-router";

export const Route = createFileRoute('/categories/$id')({
 component: Category
})

function Category(){
    return <>WIP Category</>
}