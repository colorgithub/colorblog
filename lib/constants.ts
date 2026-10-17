/** 前后端共用的业务常量。放在这里而不是 route.ts 里 ——
 *  Next.js 的路由文件只允许导出约定好的成员（GET/POST/config 等），
 *  导出其他常量会让类型检查报错。 */

export const COMMENT_MAX_LENGTH = 2000

export const POST_TITLE_MAX = 200
export const POST_SLUG_MAX = 120
export const POST_EXCERPT_MAX = 500

export const USERNAME_MIN = 3
export const USERNAME_MAX = 32
export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 72
export const NAME_MAX = 32
