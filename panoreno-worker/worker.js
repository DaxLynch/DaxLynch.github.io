const DEFAULT_ALLOWED_ORIGINS = [
  "https://daxlynch.github.io",
  "http://localhost:8000",
  "http://127.0.0.1:8000"
];

function getAllowedOrigins(env) {
  return (env.ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS.join(","))
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function getCorsHeaders(request, env) {
  const requestOrigin = request.headers.get("Origin");
  const allowedOrigins = getAllowedOrigins(env);
  const allowOrigin = allowedOrigins.includes("*")
    ? "*"
    : allowedOrigins.includes(requestOrigin)
      ? requestOrigin
      : allowedOrigins[0];

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Expose-Headers": "x-panoreno-limit,x-panoreno-remaining",
    "Vary": "Origin"
  };
}

function isOriginAllowed(request, env) {
  const requestOrigin = request.headers.get("Origin");

  if (!requestOrigin) {
    return true;
  }

  const allowedOrigins = getAllowedOrigins(env);
  return allowedOrigins.includes("*") || allowedOrigins.includes(requestOrigin);
}

function jsonResponse(request, env, status, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...getCorsHeaders(request, env),
      "content-type": "application/json",
      ...extraHeaders
    }
  });
}

async function hashVisitorKey(request) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown-ip";
  const userAgent = request.headers.get("User-Agent") || "unknown-agent";
  const encoded = new TextEncoder().encode(`${ip}:${userAgent}`);
  const digest = await crypto.subtle.digest("SHA-256", encoded);

  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function getUsage(request, env) {
  if (!env.PANORENO_LIMITS) {
    throw new Error("PANORENO_LIMITS KV binding is not configured");
  }

  const key = await hashVisitorKey(request);
  const record = await env.PANORENO_LIMITS.get(key, "json");
  const count = Number(record?.count || 0);
  const limit = Number(env.MAX_GENERATIONS || 5);

  return {
    key,
    count,
    limit,
    remaining: Math.max(0, limit - count)
  };
}

async function incrementUsage(env, usage) {
  await env.PANORENO_LIMITS.put(usage.key, JSON.stringify({
    count: usage.count + 1,
    updatedAt: new Date().toISOString()
  }));
}

async function createOpenAIFormData(request) {
  const inbound = await request.formData();
  const outbound = new FormData();
  const prompt = inbound.get("prompt");
  const mask = inbound.get("mask");
  const images = inbound.getAll("image[]");

  if (!prompt || typeof prompt !== "string") {
    throw new Error("Missing prompt");
  }

  if (!mask || typeof mask === "string") {
    throw new Error("Missing mask file");
  }

  if (images.length === 0 || images.some((image) => typeof image === "string")) {
    throw new Error("Missing image files");
  }

  outbound.append("model", "gpt-image-2");

  images.forEach((image) => {
    outbound.append("image[]", image, image.name || "image.png");
  });

  outbound.append("mask", mask, mask.name || "mask.png");
  outbound.append("prompt", prompt);
  outbound.append("quality", inbound.get("quality") || "high");
  outbound.append("size", inbound.get("size") || "auto");
  outbound.append("output_format", inbound.get("output_format") || "png");

  return outbound;
}

async function handleEdit(request, env) {
  if (!env.OPENAI_API_KEY) {
    return jsonResponse(request, env, 500, {
      error: {
        message: "OPENAI_API_KEY secret is not configured"
      }
    });
  }

  const maxBytes = Number(env.MAX_REQUEST_BYTES || 95_000_000);
  const contentLength = Number(request.headers.get("content-length") || 0);

  if (contentLength > maxBytes) {
    return jsonResponse(request, env, 413, {
      error: {
        message: "Request is too large for the public demo"
      }
    });
  }

  const usage = await getUsage(request, env);

  if (usage.remaining <= 0) {
    return jsonResponse(request, env, 429, {
      error: {
        message: `This demo is limited to ${usage.limit} successful generations per visitor.`
      }
    }, {
      "x-panoreno-limit": String(usage.limit),
      "x-panoreno-remaining": "0"
    });
  }

  const formData = await createOpenAIFormData(request);
  const openaiResponse = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: formData
  });
  const responseText = await openaiResponse.text();

  if (openaiResponse.ok) {
    await incrementUsage(env, usage);
  }

  const remaining = openaiResponse.ok ? Math.max(0, usage.remaining - 1) : usage.remaining;

  return new Response(responseText, {
    status: openaiResponse.status,
    headers: {
      ...getCorsHeaders(request, env),
      "content-type": openaiResponse.headers.get("content-type") || "application/json",
      "x-panoreno-limit": String(usage.limit),
      "x-panoreno-remaining": String(remaining)
    }
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(request, env)
      });
    }

    if (!isOriginAllowed(request, env)) {
      return jsonResponse(request, env, 403, {
        error: {
          message: "Origin is not allowed"
        }
      });
    }

    const url = new URL(request.url);

    try {
      if (request.method === "GET" && url.pathname === "/usage") {
        const usage = await getUsage(request, env);
        return jsonResponse(request, env, 200, {
          limit: usage.limit,
          remaining: usage.remaining
        }, {
          "x-panoreno-limit": String(usage.limit),
          "x-panoreno-remaining": String(usage.remaining)
        });
      }

      if (request.method === "POST" && url.pathname === "/edit") {
        return handleEdit(request, env);
      }

      return jsonResponse(request, env, 404, {
        error: {
          message: "Not found"
        }
      });
    } catch (error) {
      return jsonResponse(request, env, 500, {
        error: {
          message: error.message || "Unexpected proxy error"
        }
      });
    }
  }
};
