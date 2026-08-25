import db from '~/db'
import {createServerOnlyFn} from '@tanstack/solid-start'
import {recipes} from '~/db/cook.schema.ts'
import {eq} from 'drizzle-orm'

export const getServerRecipes = createServerOnlyFn((page: number, size: number) =>
    db.query.recipes.findMany({
        limit: size,
        offset: (page - 1) * size,
    }),
)

export const getServerRecipe = createServerOnlyFn((id: number) =>
    db.query.recipes.findFirst({
        where: eq(recipes.id, id),
    }),
)

export const getServerRandRecipe = createServerOnlyFn(() =>
    db.query.recipes.findFirst({
        orderBy: (_t, {sql}) => sql`RANDOM()`,
    })
)