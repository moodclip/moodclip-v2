import { Storage } from "@google-cloud/storage";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import * as remixNode from "@remix-run/node";

const { json, createFileUploadHandler, parseMultipartFormData } = remixNode;

const credentials = process.env.GCS_SA_KEY
  ? JSON.parse(process.env.GCS_SA_KEY)
  : undefined;

const storage = new Storage({ credentials });
const bucketName = "mf-uploads-prod";
const bucket = storage.bucket(bucketName);

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Uppy-Upload-ID",
        "Access-Control-Max-Age": "86400",
      },
    });
  }
  return new Response("Method Not Allowed", { status: 405 });
};

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
