import { json } from "@remix-run/node";
// Corrected: Use a relative path instead of a path alias
import { getGcsSignedUrl } from "../gcs.server";

export async function action({ request }: { request: Request }) {
  const { fileName, contentType } = await request.json();

  const url = await getGcsSignedUrl(fileName, contentType);

  return json({ url });
}
