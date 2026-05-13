# Panoreno OpenAI Proxy

This Cloudflare Worker keeps the OpenAI API key off the public GitHub Pages app
and limits the public demo to 5 successful generations per visitor.

## Deploy

1. Copy the example config:

```bash
cp wrangler.toml.example wrangler.toml
```

2. Create a KV namespace and put the returned IDs into `wrangler.toml`:

```bash
npx wrangler kv namespace create PANORENO_LIMITS
npx wrangler kv namespace create PANORENO_LIMITS --preview
```

3. Store the OpenAI key as a Worker secret:

```bash
npx wrangler secret put OPENAI_API_KEY
```

4. Deploy:

```bash
npx wrangler deploy
```

5. Put the deployed Worker URL in `panoreno/config.js`:

```js
window.PANORENO_GENERATION_PROXY_URL = "https://panoreno-api.your-subdomain.workers.dev";
```

When the proxy URL is configured, the GitHub Pages UI hides the OpenAI key input
and sends generation requests through the Worker.
