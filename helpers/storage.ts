// S3-compatible object storage (Neon Object Storage, or any S3 API).
// Mirrors the small surface the app used from Floot's storage helper:
//   upload()  -> presigned PUT URL (size and type pinned into the signature)
//   getUrl()  -> short-lived presigned GET URL
//   remove()  -> delete an object
// All objects are private; the browser only ever sees expiring signed URLs.
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

type Visibility = "private";

let client: S3Client | null = null;

function bucket(): string {
  const name = process.env.STORAGE_BUCKET;
  if (!name) throw new Error("STORAGE_BUCKET is not configured");
  return name;
}

function s3(): S3Client {
  if (!client) {
    client = new S3Client({
      region: process.env.AWS_REGION || "auto",
      endpoint: process.env.AWS_ENDPOINT_URL_S3,
      forcePathStyle: true,
      // Avoid adding checksum headers that a browser PUT would not send.
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
  }
  return client;
}

export async function upload(args: {
  visibility: Visibility;
  filename: string;
  contentType: string;
  sizeBytes: number;
}): Promise<
  { ok: true; presignedUrl: string } | { ok: false; error: { message: string } }
> {
  try {
    const command = new PutObjectCommand({
      Bucket: bucket(),
      Key: args.filename,
      ContentType: args.contentType,
      ContentLength: args.sizeBytes,
    });
    const presignedUrl = await getSignedUrl(s3(), command, {
      expiresIn: 15 * 60,
      // Pin the exact byte length and type so a client cannot upload more
      // than the quota check approved.
      signableHeaders: new Set(["content-type", "content-length"]),
      unhoistableHeaders: new Set(["content-type", "content-length"]),
    });
    return { ok: true, presignedUrl };
  } catch (error) {
    return {
      ok: false,
      error: { message: error instanceof Error ? error.message : "Could not sign the upload" },
    };
  }
}

export async function getUrl(args: {
  visibility: Visibility;
  filename: string;
  expiresInSeconds?: number;
}): Promise<{ ok: true; url: string } | { ok: false }> {
  try {
    const url = await getSignedUrl(
      s3(),
      new GetObjectCommand({ Bucket: bucket(), Key: args.filename }),
      { expiresIn: args.expiresInSeconds ?? 3600 },
    );
    return { ok: true, url };
  } catch {
    return { ok: false };
  }
}

export async function remove(args: {
  visibility: Visibility;
  filename: string;
}): Promise<{ ok: boolean }> {
  try {
    await s3().send(new DeleteObjectCommand({ Bucket: bucket(), Key: args.filename }));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/** Server-side upload of bytes we already hold (used by the Canva import). */
export async function putObject(args: {
  filename: string;
  body: Uint8Array;
  contentType: string;
}): Promise<void> {
  await s3().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: args.filename,
      Body: args.body,
      ContentType: args.contentType,
      ContentLength: args.body.byteLength,
    }),
  );
}
