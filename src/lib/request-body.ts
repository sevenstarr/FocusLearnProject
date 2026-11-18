import { NextRequest } from 'next/server';

export class RequestBodyError extends Error {
  constructor(message: string, readonly status: 400 | 413) {
    super(message);
    this.name = 'RequestBodyError';
  }
}

export async function readJsonBody(
  req: NextRequest,
  maxBytes = 32_768
): Promise<unknown> {
  const contentLength = Number(req.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new RequestBodyError('Request body is too large.', 413);
  }

  if (!req.body) throw new RequestBodyError('A JSON body is required.', 400);
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new RequestBodyError('Request body is too large.', 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  try {
    const text = new TextDecoder().decode(
      chunks.reduce((combined, chunk) => {
        const next = new Uint8Array(combined.length + chunk.length);
        next.set(combined);
        next.set(chunk, combined.length);
        return next;
      }, new Uint8Array())
    );
    return JSON.parse(text) as unknown;
  } catch (error) {
    if (error instanceof RequestBodyError) throw error;
    throw new RequestBodyError('Invalid JSON body.', 400);
  }
}
