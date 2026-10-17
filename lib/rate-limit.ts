/**
 * 极简内存限流器。
 *
 * 注意：这是「单实例」限流。部署在 Vercel 这类多实例环境时，
 * 每个实例各有一份计数，实际阈值会被放大。要精确限流请换成
 * Upstash Redis / @vercel/kv，把 incr + expire 换成原子操作即可，
 * 调用方接口保持不变。
 */

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

/** 防止 Map 无限增长：每次写入时顺手清掉已过期的桶。 */
function sweep(now: number) {
  if (buckets.size < 1000) return
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  retryAfter: number
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  sweep(now)

  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, retryAfter: 0 }
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    }
  }

  bucket.count += 1
  return { ok: true, remaining: limit - bucket.count, retryAfter: 0 }
}

/** 登录失败后主动清空计数，避免正常用户被自己之前的失败次数拖累。 */
export function resetRateLimit(key: string) {
  buckets.delete(key)
}

/** 从请求头里取客户端 IP，优先取代理链的第一个地址。 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip')?.trim() || 'unknown'
}

export function tooManyRequests(result: RateLimitResult, message: string) {
  return {
    error: `${message}，请 ${result.retryAfter} 秒后再试`,
    retryAfter: result.retryAfter,
  }
}
