import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadClients } from '../../auth/session'
import { bankAccounts, formatMoney, loadClientTransactions, paymentMethodName, type Transaction } from '../../data/banking'
import { findReceiptFile } from '../../data/fileStore'
import { useAdminTick } from './useAdminTick'

export type PendingPayment = { clientId: string; clientName: string; item: Transaction }

export function pendingPayments(): PendingPayment[] {
  return loadClients().flatMap((client) =>
    loadClientTransactions(client.id || 'primary')
      .filter((item) => item.status === 'pending')
      .map((item) => ({ clientId: client.id || 'primary', clientName: `${client.firstName} ${client.lastName}`, item })),
  )
}

export function AdminPaymentsPage() {
  const tick = useAdminTick()
  const rows = useMemo(() => pendingPayments(), [tick])

  return (
    <main className="max-w-5xl">
      <h1 className="text-3xl font-medium tracking-[-0.04em]">Pending payments</h1>
      <p className="mt-2 text-sm text-revolut-ink/60">Open a payment to view the receipt before approving it.</p>
      <ul className="mt-6 overflow-hidden rounded-[1.5rem] bg-white">
        {rows.length === 0 && <li className="px-5 py-8 text-sm text-revolut-ink/55">No payments are waiting.</li>}
        {rows.map((row) => {
          const account = bankAccounts.find((item) => item.id === row.item.accountId)
          return (
            <li key={`${row.clientId}-${row.item.id}`} className="border-b border-revolut-line last:border-b-0">
              <Link
                to={`/admin/payments/${row.clientId}/${encodeURIComponent(row.item.id)}`}
                className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-revolut-muted/70"
              >
                <span>
                  <span className="block font-medium">{row.item.name}</span>
                  <span className="block text-sm text-revolut-ink/55">
                    {row.clientName} · {paymentMethodName(row.item)} · {row.item.receiptFile || row.item.receiptName ? 'Receipt attached' : 'No receipt'}
                  </span>
                  <ReceiptThumb clientId={row.clientId} transactionId={row.item.id} name={row.item.receiptName} />
                </span>
                <span className="text-sm font-medium">{account ? formatMoney(row.item.amount, account.currency) : row.item.amount}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </main>
  )
}

function ReceiptThumb({ clientId, transactionId, name }: { clientId: string; transactionId: string; name?: string }) {
  const [src, setSrc] = useState('')

  useEffect(() => {
    let active = true
    findReceiptFile(clientId, transactionId).then((file) => {
      if (!active) return
      const url = file?.dataUrl ?? ''
      setSrc(url.startsWith('data:image') || file?.type.startsWith('image/') ? url : '')
    })
    return () => {
      active = false
    }
  }, [clientId, transactionId])

  if (!src) return null
  return <img src={src} alt={name || 'Receipt'} className="mt-2 h-16 w-16 rounded-lg object-cover" />
}
