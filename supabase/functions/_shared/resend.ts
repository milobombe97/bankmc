import { Resend } from 'npm:resend@4.0.0'
import { ADMIN_EMAIL, FROM_EMAIL } from './constants.ts'

export type OutboundEmail = {
  to: string | string[]
  subject: string
  html: string
  ccAdmin?: boolean
}

let client: Resend | null = null

function getResend() {
  const key = Deno.env.get('RESEND_API_KEY')
  if (!key) throw new Error('RESEND_API_KEY is not configured')
  if (!client) client = new Resend(key)
  return client
}

export async function sendEmail(message: OutboundEmail) {
  const to = Array.isArray(message.to) ? message.to : [message.to]
  const cc = message.ccAdmin ? [ADMIN_EMAIL] : undefined

  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    cc,
    subject: message.subject,
    html: message.html,
  })

  if (error) {
    console.error('[resend] send failed', { error, to, subject: message.subject })
    throw new Error(error.message)
  }

  console.log('[resend] sent', { id: data?.id, to, subject: message.subject })
  return data
}

export async function sendAdminOnly(message: { subject: string; html: string }) {
  return sendEmail({ to: ADMIN_EMAIL, subject: message.subject, html: message.html, ccAdmin: false })
}
