This `_headers` file is in Netlify format and will be picked up when deploying to Netlify.

It sets long cache lifetimes for files that are safe to cache indefinitely (hashed assets, static images, fonts) and shorter lifetimes for HTML/service-worker to ensure updates propagate.

If you deploy to a different host, translate these rules accordingly:

- Nginx: use `add_header Cache-Control "...";` in location blocks.
- Vercel: add a `vercel.json` `headers` block.
- Cloudflare Pages: set up `headers` in `cloudflare-pages.toml` or use Workers to set cache headers.

Adjust paths to match your build output if different (for example, `/_app/*` or `/build/*`).
