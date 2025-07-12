import { authenticate } from "../shopify.server";
import { Storage } from "@google-cloud/storage";
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";

// Helper functions for success and failure responses
const ok = (data: object) =>
  new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*", // You can replace with your Shopify domain if needed
    },
  });

const fail = (message: string, statusCode: number) =>
  new Response(JSON.stringify({ error: message }), {
    status: statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log("🔥 Remix booted", new Date().toISOString());
  console.log("[PROXY] /proxy/uploads reached at", new Date().toISOString());
  console.log("[PROXY] Query:", request.url.split("?")[1] ?? "(none)");

  // Authenticate App Proxy request
  let context;
  try {
    context = await authenticate.public.appProxy(request);
    console.log("[PROXY] Authentication OK for", context?.shop);
  } catch (error) {
    console.warn("[PROXY] Authentication FAILED:", error);
    return fail("Unauthorized App Proxy request", 401);
  }

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  // Check env
  const { GCS_BUCKET } = process.env;
  if (!GCS_BUCKET) {
    console.error("GCS_BUCKET environment variable was not found in process.env.");
    return fail("Server configuration error.", 500);
  }

  // Extract query params
  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get("name");
  const contentType = searchParams.get("type");

  console.log(`[Proxy] Received request for signed URL. Name: ${fileName}, Type: ${contentType}`);

  if (!fileName || !contentType) {
    return fail("Missing 'name' or 'type' query parameters.", 400);
  }

  // Generate signed URL
  try {
    const storage = new Storage();
    const bucket = storage.bucket(GCS_BUCKET);

    const options = {
      version: "v4" as const,
      action: "write" as const,
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType,
    };

    const [signedUrl] = await bucket.file(fileName).getSignedUrl(options);
    return ok({ signedUrl });

  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("Failed to generate signed URL:", error);
    return fail(`Could not generate upload URL: ${message}`, 500);
  }
};
