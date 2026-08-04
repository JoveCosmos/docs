import { config, collection, fields } from "@keystatic/core";

/**
 * Admin CMS for the docs.
 *
 * Local mode: this reads and writes the markdown files in src/content/docs
 * directly on disk. It is only mounted by `npm run cms`, never in a production
 * build, so the deployed site contains no editing UI at all.
 */
export default config({
  storage: { kind: "local" },

  ui: {
    brand: { name: "GATA HUB Docs" },
    navigation: {
      Content: ["docs"],
    },
  },

  collections: {
    docs: collection({
      label: "Pages",
      path: "src/content/docs/**",
      slugField: "title",
      format: { contentField: "body" },
      columns: ["title"],
      entryLayout: "content",

      schema: {
        title: fields.slug({
          name: {
            label: "Title",
            description: "Shown as the page heading and in the sidebar.",
            validation: { isRequired: true },
          },
          slug: {
            label: "URL path",
            description:
              "The address of the page. Changing this on an existing page breaks its old links.",
          },
        }),

        description: fields.text({
          label: "Description",
          description:
            "One or two sentences. Used for search results and link previews.",
          multiline: true,
        }),

        sidebar: fields.object(
          {
            order: fields.number({
              label: "Sidebar position",
              description:
                "Lower numbers sort higher. Leave empty for pages already ordered in the site structure.",
            }),
            label: fields.text({
              label: "Short sidebar label",
              description: "Optional. Use when the full title is too long.",
            }),
          },
          { label: "Sidebar" }
        ),

        body: fields.mdx({
          label: "Page text",
          description: "The body of the page.",
          // the content is plain .md; without this Keystatic looks for .mdx
          // and finds nothing. markdoc is deliberately not used here: it
          // rewrites standard markdown tables into {% table %} syntax, which
          // Starlight would render as literal text.
          extension: "md",
          options: {
            image: {
              directory: "public/files",
              publicPath: "/files/",
            },
          },
        }),
      },
    }),
  },
});
