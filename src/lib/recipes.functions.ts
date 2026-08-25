import {createServerFn} from "@tanstack/solid-start";
import {getServerRandRecipe} from "~/lib/recipes.server.ts";

export const getRandRecipe = createServerFn().handler(getServerRandRecipe)