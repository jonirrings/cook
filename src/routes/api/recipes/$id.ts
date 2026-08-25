import { createFileRoute } from "@tanstack/solid-router";

export const Route = createFileRoute('/api/recipes/$id')({
    server: {
        handlers: {
            GET: async ({ request }) => {
                return new Response('Hello, World!')
            },
        },
    },
});