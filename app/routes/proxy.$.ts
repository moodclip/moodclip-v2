import { Storage } from "@google-cloud/storage";
import type { LoaderFunctionArgs } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  const { GCS_BUCKET } = process.env;

  if (!GCS_BUCKET) {
    console.error("GCS_BUCKET environment variable was not found in process.env.");
    return new Response(JSON.stringify({ error: "Server configuration error." }), {
        status: 500,
        headers: { "Content-Type": "application/liquid" },
    });
  }

  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get("name");
  const contentType = searchParams.get("type");

  if (!fileName || !contentType) {
    return new Response(JSON.stringify({ error: "Missing 'name' or 'type' query parameters." }), {
        status: 400,
        headers: { "Content-Type": "application/liquid" },
    });
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
    return new Response(JSON.stringify({ signedUrl }), {
        headers: { "Content-Type": "application/liquid" },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("Failed to generate signed URL:", error);
    const errorResponse = { error: "Could not generate upload URL.", details: message };
    return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/liquid" },
    });
  }
};
