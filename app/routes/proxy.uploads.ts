import { Storage } from "@google-cloud/storage";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {

  const { GCS_BUCKET } = process.env;

  if (!GCS_BUCKET) {
    console.error("GCS_BUCKET environment variable was not found in process.env.");
    return json({ error: "Server configuration error: GCS_BUCKET is missing." }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get("name");
  const contentType = searchParams.get("type");

  if (!fileName || !contentType) {
    return json({ error: "Missing 'name' or 'type' query parameters." }, { status: 400 });
  }

  try {
    const storage = new Storage();
    const bucket = storage.bucket(GCS_BUCKET);

    const options = {
      version: "v4" as const,
      action: "write" as const,
      expires: Date.now() + 15 * 60 * 1000,
      contentType,
    };

    const [signedUrl] = await bucket.file(fileName).getSignedUrl(options);
    return json({ signedUrl });

  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("Failed to generate signed URL:", error);
    return json({ error: "Could not generate upload URL.", details: message }, { status: 500 });
  }
};
