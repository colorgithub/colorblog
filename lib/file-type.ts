/**
 * 服务端文件类型嗅探。
 *
 * 绝不信任客户端传来的 Content-Type —— 那是攻击者完全可控的字段。
 * 这里只认文件头的魔数，并且用嗅探结果决定响应头里的 Content-Type
 * 和 Content-Disposition，客户端说了不算。
 *
 * 注意：SVG 被刻意排除在白名单之外。SVG 可以内嵌 <script>，一旦以
 * image/svg+xml 内联返回就是一个同源 XSS。
 */

export interface FileType {
  mime: string
  ext: string
  /** 是否可以作为图片内联展示（其余一律强制下载）。 */
  inline: boolean
}

const SIGNATURES: Array<{ type: FileType; magic: number[]; offset?: number }> = [
  { type: { mime: 'image/jpeg', ext: 'jpg', inline: true }, magic: [0xff, 0xd8, 0xff] },
  {
    type: { mime: 'image/png', ext: 'png', inline: true },
    magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  },
  { type: { mime: 'image/gif', ext: 'gif', inline: true }, magic: [0x47, 0x49, 0x46, 0x38] },
  { type: { mime: 'application/pdf', ext: 'pdf', inline: false }, magic: [0x25, 0x50, 0x44, 0x46] },
  { type: { mime: 'application/zip', ext: 'zip', inline: false }, magic: [0x50, 0x4b, 0x03, 0x04] },
]

function startsWith(buffer: Buffer, magic: number[], offset = 0): boolean {
  if (buffer.length < offset + magic.length) return false
  return magic.every((byte, i) => buffer[offset + i] === byte)
}

export function detectFileType(buffer: Buffer): FileType | null {
  for (const { type, magic, offset } of SIGNATURES) {
    if (startsWith(buffer, magic, offset)) return type
  }

  // WebP: "RIFF" .... "WEBP"
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { mime: 'image/webp', ext: 'webp', inline: true }
  }

  return null
}

export const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'zip']
export const ALLOWED_ACCEPT = 'image/jpeg,image/png,image/gif,image/webp,application/pdf,application/zip'
export const MAX_FILE_SIZE = 4 * 1024 * 1024
/** 单用户文件数量与总容量上限，避免被当成免费图床。 */
export const MAX_FILES_PER_USER = 200
export const MAX_TOTAL_BYTES_PER_USER = 100 * 1024 * 1024
