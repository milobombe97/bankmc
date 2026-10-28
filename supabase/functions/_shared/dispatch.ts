import {
  accountDeletedEmail,
  accountStatusAdminEmail,
  accountSuspendedEmail,
  internalTransferEmail,
  kycDecisionEmail,
  kycSubmittedAdminEmail,
  kycSubmittedEmail,
  receiptDecisionEmail,
  receiptSubmittedAdminEmail,
  receiptSubmittedEmail,
  adminBalanceAdjustAdminEmail,
  adminBalanceAdjustEmail,
  transferAdminEmail,
  transferReceiverEmail,
  transferSenderEmail,
  welcomeEmail,
} from './templates/messages.ts'
import { sendAdminOnly, sendEmail } from './resend.ts'
import { getAccountCurrency, getProfile, getTransaction, type ProfileRow } from './supabase-admin.ts'

async function dispatchApprovedTransfer(record: Record<string, unknown>) {
  const txId = String(record.id ?? '')
  const amount = Number(record.amount)
  if (txId.endsWith('-in')) return { handled: false as const, reason: 'incoming leg skipped' }
  if (amount >= 0) return { handled: false as const, reason: 'not outgoing leg' }

  const userId = String(record.user_id)
  const sender = await getProfile(userId)
  if (!sender?.email) return { handled: false as const, reason: 'missing sender' }
  const currency = await getAccountCurrency(userId, String(record.account_id ?? 'personal'))
  const description = String(record.name ?? 'Transfer')

  const incoming = await getTransaction(`${txId}-in`)
  if (incoming) {
    const receiver = await getProfile(incoming.user_id)
    if (!receiver?.email) return { handled: false as const, reason: 'missing receiver' }
    const counterparty = receiver.email
    const senderMsg = transferSenderEmail(amount, currency, counterparty, description)
    const receiverMsg = transferReceiverEmail(Number(incoming.amount), currency, sender.email, incoming.name)
    await sendEmail({ to: sender.email, subject: senderMsg.subject, html: senderMsg.html })
    await sendEmail({ to: receiver.email, subject: receiverMsg.subject, html: receiverMsg.html })
    const adminMsg = transferAdminEmail(sender.email, receiver.email, amount, currency, description)
    await sendAdminOnly(adminMsg)
    return { handled: true as const, event: 'transfer_p2p' }
  }

  const internalMsg = internalTransferEmail(Math.abs(amount), currency, description)
  await sendEmail({ to: sender.email, subject: internalMsg.subject, html: internalMsg.html, ccAdmin: true })
  await sendAdminOnly(transferAdminEmail(sender.email, sender.email, amount, currency, description))
  return { handled: true as const, event: 'transfer_internal' }
}

type WebhookPayload = {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  schema?: string
  record: Record<string, unknown>
  old_record?: Record<string, unknown> | null
}

function tableName(table: string) {
  return table.includes('.') ? table.split('.').pop()! : table
}

function profileName(profile: ProfileRow | null) {
  if (!profile) return 'Customer'
  const name = `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim()
  return name || profile.email
}

export async function dispatchTransactionalEmail(payload: WebhookPayload) {
  const table = tableName(payload.table)
  const record = payload.record
  const old = payload.old_record ?? null

  if (table === 'profiles') {
    if (payload.type === 'INSERT') {
      const email = String(record.email ?? '')
      if (!email) return { handled: false, reason: 'missing email' }
      const msg = welcomeEmail(profileName(record as ProfileRow))
      await sendEmail({ to: email, subject: msg.subject, html: msg.html, ccAdmin: true })
      return { handled: true, event: 'welcome' }
    }

    if (payload.type === 'UPDATE') {
      const next = String(record.status ?? '')
      const prev = String(old?.status ?? '')
      if (next === prev) return { handled: false, reason: 'status unchanged' }
      const email = String(record.email ?? '')
      if (!email) return { handled: false, reason: 'missing email' }

      if (next === 'suspended' && prev !== 'suspended') {
        const msg = accountSuspendedEmail()
        await sendEmail({ to: email, subject: msg.subject, html: msg.html, ccAdmin: true })
        const admin = accountStatusAdminEmail(email, 'suspended')
        await sendAdminOnly(admin)
        return { handled: true, event: 'account_suspended' }
      }

      if (next === 'deleted' && prev !== 'deleted') {
        const msg = accountDeletedEmail()
        await sendEmail({ to: email, subject: msg.subject, html: msg.html, ccAdmin: true })
        const admin = accountStatusAdminEmail(email, 'deleted')
        await sendAdminOnly(admin)
        return { handled: true, event: 'account_deleted' }
      }
    }
  }

  if (table === 'kyc_submissions') {
    if (payload.type === 'INSERT') {
      const userId = String(record.user_id)
      const profile = await getProfile(userId)
      if (!profile?.email) return { handled: false, reason: 'missing profile' }
      const userMsg = kycSubmittedEmail()
      await sendEmail({ to: profile.email, subject: userMsg.subject, html: userMsg.html, ccAdmin: true })
      const adminMsg = kycSubmittedAdminEmail(profile.email, String(record.id_type ?? 'ID'))
      await sendAdminOnly(adminMsg)
      return { handled: true, event: 'kyc_submitted' }
    }

    if (payload.type === 'UPDATE') {
      const status = String(record.status ?? '')
      const prev = String(old?.status ?? '')
      if (status === prev || (status !== 'approved' && status !== 'rejected')) {
        return { handled: false, reason: 'not a decision update' }
      }
      const userId = String(record.user_id)
      const profile = await getProfile(userId)
      if (!profile?.email) return { handled: false, reason: 'missing profile' }
      const approved = status === 'approved'
      const msg = kycDecisionEmail(approved, String(record.rejection_reason ?? '') || undefined)
      await sendEmail({ to: profile.email, subject: msg.subject, html: msg.html, ccAdmin: true })
      return { handled: true, event: approved ? 'kyc_approved' : 'kyc_rejected' }
    }
  }

  if (table === 'receipts') {
    if (payload.type === 'INSERT') {
      const userId = String(record.user_id)
      const profile = await getProfile(userId)
      if (!profile?.email) return { handled: false, reason: 'missing profile' }
      const amount = Number(record.amount)
      const currency = String(record.currency ?? 'GBP')
      const userMsg = receiptSubmittedEmail(amount, currency)
      await sendEmail({ to: profile.email, subject: userMsg.subject, html: userMsg.html, ccAdmin: true })
      const adminMsg = receiptSubmittedAdminEmail(profile.email, amount, currency)
      await sendAdminOnly(adminMsg)
      return { handled: true, event: 'receipt_submitted' }
    }

    if (payload.type === 'UPDATE') {
      const status = String(record.status ?? '')
      const prev = String(old?.status ?? '')
      if (status === prev || (status !== 'approved' && status !== 'rejected')) {
        return { handled: false, reason: 'not a decision update' }
      }
      const userId = String(record.user_id)
      const profile = await getProfile(userId)
      if (!profile?.email) return { handled: false, reason: 'missing profile' }
      const amount = Number(record.amount)
      const currency = String(record.currency ?? 'GBP')
      const approved = status === 'approved'
      const msg = receiptDecisionEmail(
        approved,
        amount,
        currency,
        String(record.rejection_reason ?? '') || undefined,
      )
      await sendEmail({ to: profile.email, subject: msg.subject, html: msg.html, ccAdmin: true })
      return { handled: true, event: approved ? 'receipt_approved' : 'receipt_rejected' }
    }
  }

  if (table === 'transactions' && payload.type === 'INSERT') {
    const category = String(record.category ?? '')
    const status = String(record.status ?? '')
    const txId = String(record.id ?? '')
    const amount = Number(record.amount)
    const method = String(record.method ?? '')

    if (method === 'Admin' && status === 'approved') {
      const userId = String(record.user_id)
      const profile = await getProfile(userId)
      if (!profile?.email) return { handled: false, reason: 'missing profile' }
      const currency = await getAccountCurrency(userId, String(record.account_id ?? 'personal'))
      if (amount > 0) {
        const msg = receiptDecisionEmail(true, amount, currency)
        await sendEmail({ to: profile.email, subject: msg.subject, html: msg.html, ccAdmin: true })
        const adminMsg = adminBalanceAdjustAdminEmail(profile.email, amount, currency, 'fund')
        await sendAdminOnly(adminMsg)
        return { handled: true, event: 'admin_fund' }
      }
      if (amount < 0) {
        const msg = adminBalanceAdjustEmail(Math.abs(amount), currency, 'defund')
        await sendEmail({ to: profile.email, subject: msg.subject, html: msg.html, ccAdmin: true })
        const adminMsg = adminBalanceAdjustAdminEmail(profile.email, Math.abs(amount), currency, 'defund')
        await sendAdminOnly(adminMsg)
        return { handled: true, event: 'admin_defund' }
      }
      return { handled: false, reason: 'zero amount' }
    }

    if (category !== 'Transfer' || status !== 'approved') return { handled: false, reason: 'not transfer' }
    return await dispatchApprovedTransfer(record)
  }

  if (table === 'transactions' && payload.type === 'UPDATE') {
    const category = String(record.category ?? '')
    const status = String(record.status ?? '')
    const prev = String(old?.status ?? '')
    if (category !== 'Transfer' || status !== 'approved' || prev === 'approved') {
      return { handled: false, reason: 'not transfer approval' }
    }
    return await dispatchApprovedTransfer(record)
  }

  return { handled: false, reason: 'no matching event' }
}
