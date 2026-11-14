import { Readable } from "node:stream";
import { google } from "googleapis";
import { GoogleAuth } from "google-auth-library";

function getDriveClient() {
  const saKey = process.env.GOOGLE_SA_KEY;
  if (!saKey) {
    throw new Error("GOOGLE_SA_KEY is not set in environment variables");
  }

  let credentials;
  let raw = saKey.trim();

  // Strip surrounding single or double quotes added by some .env parsers
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    raw = raw.slice(1, -1).trim();
  }

  // Support base64-encoded SA key
  if (!raw.startsWith("{")) {
    try {
      const decoded = Buffer.from(raw, "base64").toString("utf-8");
      if (decoded.trim().startsWith("{")) {
        raw = decoded.trim();
      }
    } catch {
      // not base64, continue
    }
  }

  try {
    credentials = JSON.parse(raw);
  } catch {
    // Some env loaders escape literal \n inside the private_key; fix them
    try {
      credentials = JSON.parse(raw.replace(/\\n/g, "\n"));
    } catch {
      throw new Error("GOOGLE_SA_KEY must be a valid JSON string or base64-encoded JSON");
    }
  }

  const auth = new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });

  return google.drive({ version: "v3", auth });
}

export async function listDriveCertificates(): Promise<
  { id: string; name: string }[]
> {
  const folderId = process.env.DRIVE_FOLDER_ID;
  if (!folderId) {
    throw new Error("DRIVE_FOLDER_ID is not set in environment variables");
  }

  const drive = getDriveClient();
  const items: { id: string; name: string }[] = [];
  let pageToken: string | undefined;

  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "nextPageToken, files(id, name)",
      pageSize: 200,
      pageToken,
    });

    for (const file of res.data.files ?? []) {
      if (file.id && file.name) {
        items.push({ id: file.id, name: file.name });
      }
    }
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  return items;
}

export async function openDriveCertificate(
  fileId: string,
): Promise<ReadableStream<Uint8Array>> {
  const drive = getDriveClient();
  const res = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "stream" },
  );

  return Readable.toWeb(
    res.data as Readable,
  ) as unknown as ReadableStream<Uint8Array>;
}
