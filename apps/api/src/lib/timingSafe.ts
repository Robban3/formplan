// Constant-time string comparison for secrets (webhook keys etc.). Hashing both
// inputs to a fixed 32-byte digest first means neither the contents nor the
// length of the expected secret leak through timing. Uses Web Crypto, which is
// available in Cloudflare Workers.
export async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder()
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b)),
  ])
  const va = new Uint8Array(ha)
  const vb = new Uint8Array(hb)
  let diff = 0
  for (let i = 0; i < va.length; i++) diff |= (va[i] as number) ^ (vb[i] as number)
  return diff === 0
}
