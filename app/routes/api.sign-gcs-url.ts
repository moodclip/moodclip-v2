// This endpoint handles POST requests to /api/sign-gcs-url
// It expects a JSON body with {fileName, contentType}
import { json } from "@remix-run/node";
import { Storage } from '@google-cloud/storage';

// This function will be triggered on a POST request
export async function action({ request }: { request: Request }) {
  // This is your actual GCS bucket name
  const bucketName = 'mf-uploads-prod';

  // Initialize the Google Cloud Storage client
const storage = new Storage({
  keyFilename: 'google-credentials.json',
});
  // Get a reference to the specific GCS bucket you created
  const bucket = storage.bucket(bucketName);

  // Parse the incoming request body to get the file details
  const { fileName, contentType } = await request.json();

  // Define the options for the signed URL
  const options = {
    version: 'v4' as const, // Use the latest and most secure version
    action: 'write' as const, // This URL is for uploading/writing a file
    expires: Date.now() + 15 * 60 * 1000, // The URL will be valid for 15 minutes
    contentType, // The file type must match what the client specified
  };

  // Generate the signed URL from Google Cloud Storage
  const [url] = await bucket.file(fileName).getSignedUrl(options);

  // Return the generated URL to the frontend as JSON
  return json({ url });
}