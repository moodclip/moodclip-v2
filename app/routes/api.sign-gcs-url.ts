import { json } from "@remix-run/node";
import { getGcsSignedUrl } from "~/gcs.server"; // Import from our new server file

export async function action({ request }: { request: Request }) {
  const { fileName, contentType } = await request.json();

  const url = await getGcsSignedUrl(fileName, contentType);

  return json({ url });
}
