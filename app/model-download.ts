/** Static hosts may serve .gz as a compressed response or as a gzip file.
 * Fetch already decodes Content-Encoding; inspect the payload to avoid decoding twice.
 */
export async function decodeModelResponse(
  response: Response,
  expectedBytes: number,
  compressed: boolean,
): Promise<ArrayBuffer> {
  if (!response.ok) throw new Error("模型文件加载失败，请检查网络后重试。");
  const payload = await response.arrayBuffer(),
    signature = new Uint8Array(payload, 0, Math.min(2, payload.byteLength));
  const gzip = compressed && signature[0] === 0x1f && signature[1] === 0x8b;
  const buffer = gzip
    ? await new Response(
        new Blob([payload]).stream().pipeThrough(new DecompressionStream("gzip")),
      ).arrayBuffer()
    : payload;
  if (buffer.byteLength !== expectedBytes) throw new Error("模型文件不完整，请刷新页面重新加载。");
  return buffer;
}
