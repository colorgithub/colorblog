import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder')
const FROM_EMAIL = process.env.EMAIL_FROM || 'My Blog <onboarding@resend.dev>'
const SITE_URL = process.env.SITE_URL || 'http://localhost:3000'

export async function sendVerificationEmail(to: string, token: string) {
  const verifyUrl = `${SITE_URL}/verify?token=${token}`

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: '验证你的邮箱 - My Blog',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 16px;">
          <h1 style="color: #0f172a; font-size: 24px; margin: 0 0 16px;">验证你的邮箱</h1>
          <p style="color: #475569; line-height: 1.6; margin: 0 0 24px;">
            感谢注册 My Blog！请点击下面的按钮验证你的邮箱地址，完成注册。
          </p>
          <a href="${verifyUrl}"
             style="display: inline-block; padding: 12px 32px; background: #0ea5e9; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold;">
            验证邮箱
          </a>
          <p style="color: #94a3b8; font-size: 13px; margin: 24px 0 0;">
            如果按钮无法点击，请复制以下链接到浏览器打开：<br/>
            <span style="word-break: break-all;">${verifyUrl}</span>
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin: 16px 0 0;">
            如果这不是你注册的，请忽略此邮件。验证链接 24 小时内有效。
          </p>
        </div>
      `,
    })
    return true
  } catch (err) {
    console.error('Failed to send verification email:', err)
    return false
  }
}
