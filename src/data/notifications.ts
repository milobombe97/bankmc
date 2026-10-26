import type { Account } from '../auth/session'
import { bankAccounts, formatMoney, paymentMethodName, type Transaction } from './banking'

export type AppNotification = {
  id: string
  title: string
  body: string
  date: string
  href: string
}

const READ_KEY = 'revolut-clone-notifications-read'

const history: AppNotification[] = [
  {
    id: 'salary-oct',
    title: 'Salary received',
    body: '£2,450.00 arrived in Personal.',
    date: '2026-10-23',
    href: '/dashboard',
  },
  {
    id: 'cashback-oct',
    title: 'Cash back this month',
    body: '1% back on card spend is available this month.',
    date: '2026-10-26',
    href: '/dashboard',
  },
  {
    id: 'card-ready',
    title: 'Card is ready',
    body: 'Your Nevolute Inc. card can be viewed under Cards.',
    date: '2026-10-18',
    href: '/dashboard/cards',
  },
]

export function loadReadIds() {
  try {
    const raw = JSON.parse(localStorage.getItem(READ_KEY) ?? '[]') as string[]
    return new Set(raw)
  } catch {
    return new Set<string>()
  }
}

function writeRead(ids: Set<string>) {
  localStorage.setItem(READ_KEY, JSON.stringify([...ids]))
  window.dispatchEvent(new Event('notifications-changed'))
}

export function markNotificationRead(id: string) {
  const ids = loadReadIds()
  ids.add(id)
  writeRead(ids)
}

export function markAllNotificationsRead(items: AppNotification[]) {
  const ids = loadReadIds()
  items.forEach((item) => ids.add(item.id))
  writeRead(ids)
}

export function buildNotifications(account: Account | null, transactions: Transaction[]) {
  const items: AppNotification[] = []
  if (account?.kycStatus === 'in_review') {
    items.push({
      id: 'kyc-review',
      title: 'Identity check in review',
      body: 'Nevolute Inc. limits some payments until this is approved.',
      date: '2026-10-26',
      href: '/dashboard/profile',
    })
  }
  transactions
    .filter((item) => item.status === 'pending')
    .forEach((item) => {
      const accountName = bankAccounts.find((entry) => entry.id === item.accountId)
      const money = formatMoney(Math.abs(item.amount), accountName?.currency ?? 'GBP')
      const method = paymentMethodName(item)
      items.push({
        id: `pending-${item.id}`,
        title: item.name.startsWith('Withdrawal')
          ? 'Withdrawal pending'
          : item.amount > 0
            ? 'Top up pending'
            : 'Transfer pending',
        body: item.receiptSent
          ? `${money} via ${method} is pending review. Once approved, it can take 1 to 24 hours to show in the account.`
          : item.receiptName
            ? `${money} via ${method} has a receipt attached. Send it from the receipt panel.`
            : `${money} via ${method} is waiting for a receipt.`,
        date: item.date,
        href: item.name.startsWith('Withdrawal')
          ? '/dashboard/withdraw'
          : item.amount > 0
            ? '/dashboard/topup'
            : '/dashboard/payments',
      })
    })
  return [...items, ...history]
}
