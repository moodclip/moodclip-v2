import {
  json,
  createFileUploadHandler,
  parseMultipartFormData,
  type ActionFunctionArgs,
} from "@remix-run/node";
import { Storage } from "@google-cloud/storage";

// --- Configuration for Production ---
// On a live server, we'll get credentials from an environment variable.
// This is more secure than storing a key file on the server.
const credentials = process.env.GCS_SA_KEY
  ? JSON.parse(process.env.GCS_SA_KEY)
  : undefined;

// The Storage constructor will automatically use the credentials from the
// GOOGLE_APPLICATION_CREDENTIALS file path on your local machine if the
// GCS_SA_KEY variable isn't set.
const storage = new Storage({ credentials });

const bucketName = "mf-uploads-prod";
const bucket = storage.bucket(bucketName);

export const action = async ({ request }: ActionFunctionArgs) => {
  const uploadHandler = createFileUploadHandler({
    maxPartSize: 500_000_000,
  });

  try {
    const formData = await parseMultipartFormData(request, uploadHandler);
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return json({ error: "File not found in form data." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const blob = bucket.file(file.name);
    const blobStream = blob.createWriteStream({
      contentType: file.type,
      resumable: false,
    });

    const uploadPromise = new Promise((resolve, reject) => {
      blobStream.on("finish", () => {
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        resolve({ success: true, url: publicUrl });
      });
      blobStream.on("error", (err) => {
        reject(err);
      });
      blobStream.end(buffer);
    });

    const result = await uploadPromise;
    return json(result);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("Upload to GCS failed:", message);
    return json({ error: "Upload failed.", details: message }, { status: 500 });
  }
};
