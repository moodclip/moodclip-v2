console.log('🔥 Remix booted', new Date().toISOString());
import { Storage } from "@google-cloud/storage";
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";

// Helper to send a success response with pure JSON
const ok = (data: object) => json(data, { status: 200 });

// Helper to send an error response with pure JSON
const fail = (message: string, statusCode: number) => json({ error: message }, { status: statusCode });

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  const { GCS_BUCKET } = process.env;

  if (!GCS_BUCKET) {
    console.error("GCS_BUCKET environment variable was not found in process.env.");
    return fail("Server configuration error.", 500);
  }

  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get("name");
  const contentType = searchParams.get("type");

  console.log(`[Proxy] Received request for signed URL. Name: ${fileName}, Type: ${contentType}`);

  if (!fileName || !contentType) {
    return fail("Missing 'name' or 'type' query parameters.", 400);
  }

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
