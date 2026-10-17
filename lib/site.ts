/**
 * 客户端与服务端都能安全导入的站点常量。
 *
 * 这里**只能**放不含副作用、不会抛错的值。
 * 原因：客户端组件（如 Header、AdminShell）会 import 本模块，模块体会被
 * 打进浏览器 bundle 并在浏览器里执行。
 *
 * 反过来，lib/env.ts 里有 `required('JWT_SECRET', 32)` 这类顶层校验，
 * 在浏览器里 process.env.JWT_SECRET 永远是 undefined，一加载就抛错，
 * 会导致整个 layout 崩溃并显示 "Application error: a client-side exception"。
 *
 * 因此：需要在客户端显示的配置，用 NEXT_PUBLIC_* 前缀（Next 会内联进 bundle），
 * 且必须放在本文件里。
 */

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'My Blog'

/** 站点描述，用于 metadata 与页脚。 */
export const SITE_DESCRIPTION = '记录技术、生活和思考。用文字沉淀知识，用分享连接世界。'
