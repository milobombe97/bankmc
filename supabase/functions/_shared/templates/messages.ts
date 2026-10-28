import { DASHBOARD_URL } from '../constants.ts'
import { formatMoney, escapeHtml } from '../format.ts'
import { detailsTable, detailRow, renderEmailLayout, statusPill } from './layout.ts'

export function welcomeEmail(name: string) {
  const safeName = name.trim() || 'there'
  return {
    subject: 'Welcome to Nevolute Inc.',
    html: renderEmailLayout({
      preheader: 'Your Nevolute account is ready.',
      title: 'Welcome aboard',
      bodyHtml: `
        <p>Hi ${escapeHtml(safeName)},</p>
        <p>Thanks for joining <strong>Nevolute Inc.</strong> Your account is ready. Complete identity verification when you are ready to unlock the full dashboard.</p>
        <p>We keep your money and data protected with review workflows for top-ups, transfers, and withdrawals.</p>
      `,
      ctaLabel: 'Open dashboard',
      ctaHref: DASHBOARD_URL,
    }),
  }
}

export function kycSubmittedEmail() {
  return {
    subject: 'Identity check received',
    html: renderEmailLayout({
      preheader: 'We are reviewing your documents.',
      title: 'KYC submitted',
      bodyHtml: `
        <p>We received your identity documents and proof of address.</p>
        <p>${statusPill('In review', 'warning')}</p>
        <p>Our team will review your submission shortly. You will receive another email when a decision is made.</p>
      `,
      ctaLabel: 'View status',
      ctaHref: DASHBOARD_URL,
    }),
  }
}

export function kycSubmittedAdminEmail(email: string, idType: string) {
  return {
    subject: 'New KYC submission',
    html: renderEmailLayout({
      title: 'KYC awaiting review',
      bodyHtml: `
        <p>A customer submitted identity documents for review.</p>
        ${detailsTable(detailRow('Customer', email) + detailRow('Document type', idType))}
      `,
    }),
  }
}

export function kycDecisionEmail(approved: boolean, reason?: string) {
  return {
    subject: approved ? 'Identity verified' : 'Identity check update',
    html: renderEmailLayout({
      preheader: approved ? 'Your identity is verified.' : 'We need you to resubmit.',
      title: approved ? 'KYC approved' : 'KYC not approved',
      bodyHtml: approved
        ? `<p>Your identity check is complete. ${statusPill('Verified', 'success')}</p><p>You now have full access to Nevolute Inc. banking features.</p>`
        : `<p>We could not approve your identity check. ${statusPill('Rejected', 'danger')}</p>
           ${reason ? `<p><strong>Reason:</strong> ${escapeHtml(reason)}</p>` : ''}
           <p>Sign in to resubmit corrected documents.</p>`,
      ctaLabel: 'Open dashboard',
      ctaHref: DASHBOARD_URL,
    }),
  }
}

export function receiptSubmittedEmail(amount: number, currency: string) {
  return {
    subject: 'Top-up receipt received',
    html: renderEmailLayout({
      preheader: 'Your top-up is pending review.',
      title: 'Receipt submitted',
      bodyHtml: `
        <p>We received your top-up receipt for <strong>${formatMoney(amount, currency)}</strong>.</p>
        <p>${statusPill('Pending review', 'warning')}</p>
        <p>Your balance will update after our team approves the payment.</p>
      `,
      ctaLabel: 'View activity',
      ctaHref: DASHBOARD_URL,
    }),
  }
}

export function receiptSubmittedAdminEmail(email: string, amount: number, currency: string) {
  return {
    subject: 'New top-up receipt to review',
    html: renderEmailLayout({
      title: 'Receipt awaiting approval',
      bodyHtml: `
        <p>A customer uploaded a receipt for a top-up.</p>
        ${detailsTable(detailRow('Customer', email) + detailRow('Amount', formatMoney(amount, currency)))}
      `,
    }),
  }
}

export function receiptDecisionEmail(approved: boolean, amount: number, currency: string, reason?: string) {
  return {
    subject: approved ? 'Top-up approved' : 'Top-up receipt declined',
    html: renderEmailLayout({
      title: approved ? 'Receipt approved' : 'Receipt declined',
      bodyHtml: approved
        ? `<p>Your top-up of <strong>${formatMoney(amount, currency)}</strong> was approved. ${statusPill('Credited', 'success')}</p><p>The funds are now on your account balance.</p>`
        : `<p>Your top-up receipt was declined. ${statusPill('Declined', 'danger')}</p>
           ${reason ? `<p><strong>Reason:</strong> ${escapeHtml(reason)}</p>` : ''}`,
      ctaLabel: 'View balance',
      ctaHref: DASHBOARD_URL,
    }),
  }
}

export function adminBalanceAdjustEmail(amount: number, currency: string, direction: 'fund' | 'defund') {
  const funded = direction === 'fund'
  return {
    subject: funded ? 'Balance updated' : 'Balance adjustment',
    html: renderEmailLayout({
      title: funded ? 'Funds added to your account' : 'Funds removed from your account',
      bodyHtml: funded
        ? `<p><strong>${formatMoney(amount, currency)}</strong> was added to your account by Nevolute Inc. ${statusPill('Credited', 'success')}</p>`
        : `<p><strong>${formatMoney(amount, currency)}</strong> was removed from your account by Nevolute Inc. ${statusPill('Debited', 'warning')}</p>`,
      ctaLabel: 'View balance',
      ctaHref: DASHBOARD_URL,
    }),
  }
}

export function adminBalanceAdjustAdminEmail(
  customerEmail: string,
  amount: number,
  currency: string,
  direction: 'fund' | 'defund',
) {
  return {
    subject: direction === 'fund' ? 'Admin: client balance funded' : 'Admin: client balance reduced',
    html: renderEmailLayout({
      title: direction === 'fund' ? 'Balance funded' : 'Balance reduced',
      bodyHtml: `
        <p>Staff adjusted a client balance.</p>
        ${detailsTable(
          detailRow('Customer', customerEmail) +
            detailRow('Direction', direction === 'fund' ? 'Fund' : 'Defund') +
            detailRow('Amount', formatMoney(amount, currency)),
        )}
      `,
    }),
  }
}

export function transferSenderEmail(amount: number, currency: string, counterparty: string, description: string) {
  return {
    subject: 'Transfer sent',
    html: renderEmailLayout({
      title: 'Transfer completed',
      bodyHtml: `
        <p>You sent <strong>${formatMoney(Math.abs(amount), currency)}</strong> to <strong>${escapeHtml(counterparty)}</strong>.</p>
        ${detailsTable(detailRow('Description', description))}
        <p>${statusPill('Completed', 'success')}</p>
      `,
      ctaLabel: 'View activity',
      ctaHref: DASHBOARD_URL,
    }),
  }
}

export function transferReceiverEmail(amount: number, currency: string, sender: string, description: string) {
  return {
    subject: 'Money received',
    html: renderEmailLayout({
      title: 'Incoming transfer',
      bodyHtml: `
        <p>You received <strong>${formatMoney(amount, currency)}</strong> from <strong>${escapeHtml(sender)}</strong>.</p>
        ${detailsTable(detailRow('Description', description))}
        <p>${statusPill('Completed', 'success')}</p>
      `,
      ctaLabel: 'View balance',
      ctaHref: DASHBOARD_URL,
    }),
  }
}

export function transferAdminEmail(
  senderEmail: string,
  receiverEmail: string,
  amount: number,
  currency: string,
  description: string,
) {
  return {
    subject: 'Transfer completed (customer)',
    html: renderEmailLayout({
      title: 'Transfer notification',
      bodyHtml: `
        <p>A transfer was posted on Nevolute Inc.</p>
        ${detailsTable(
          detailRow('From', senderEmail) +
            detailRow('To', receiverEmail) +
            detailRow('Amount', formatMoney(Math.abs(amount), currency)) +
            detailRow('Description', description),
        )}
      `,
    }),
  }
}

export function internalTransferEmail(amount: number, currency: string, description: string) {
  return {
    subject: 'Transfer between your accounts',
    html: renderEmailLayout({
      title: 'Internal transfer completed',
      bodyHtml: `
        <p>You moved <strong>${formatMoney(amount, currency)}</strong> between your Nevolute accounts.</p>
        ${detailsTable(detailRow('Details', description))}
      `,
      ctaLabel: 'View accounts',
      ctaHref: DASHBOARD_URL,
    }),
  }
}

export function accountSuspendedEmail() {
  return {
    subject: 'Account suspended',
    html: renderEmailLayout({
      title: 'Account suspended',
      bodyHtml: `
        <p>Your Nevolute Inc. account has been suspended. ${statusPill('Suspended', 'warning')}</p>
        <p>You cannot sign in or move money until an administrator reactivates your account. Contact ${escapeHtml('info@nevoluteinc.com')} if you need help.</p>
      `,
    }),
  }
}

export function accountDeletedEmail() {
  return {
    subject: 'Account closed',
    html: renderEmailLayout({
      title: 'Account closed',
      bodyHtml: `
        <p>Your Nevolute Inc. account has been closed. ${statusPill('Closed', 'neutral')}</p>
        <p>You will no longer be able to access this account. Contact support if you believe this was a mistake.</p>
      `,
    }),
  }
}

export function accountStatusAdminEmail(email: string, status: 'suspended' | 'deleted') {
  return {
    subject: `Customer account ${status}`,
    html: renderEmailLayout({
      title: `Account ${status}`,
      bodyHtml: `
        <p>A customer profile status was updated.</p>
        ${detailsTable(detailRow('Email', email) + detailRow('Status', status))}
      `,
    }),
  }
}
