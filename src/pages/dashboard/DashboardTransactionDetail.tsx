import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { attachReceipt, bankAccounts, formatMoney, loadTransactions, paymentMethodName } from '../../data/banking'
import { readStoredFile } from '../../data/files'
import { loadAccount } from '../../auth/session'

export function DashboardTransactionDetail() {
  const { id = '' } = useParams()
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const sync = () => setTick((value) => value + 1)
    window.addEventListener('ledger-changed', sync)
    return () => window.removeEventListener('ledger-changed', sync)
  }, [])

  const item = loadTransactions().find((entry) => entry.id === decodeURIComponent(id))
  void tick

  if (!item) {
    return (
      <main className="max-w-3xl">
        <BackLink to="/dashboard" label="Activity" />
        <h1 className="mt-4 text-3xl font-medium tracking-[-0.04em]">Transaction not found</h1>
        <p className="mt-2 text-sm text-revolut-ink/60">This payment is not on the account stored in this browser.</p>
      </main>
    )
  }

  const account = bankAccounts.find((entry) => entry.id === item.accountId)
  const currency = account?.currency ?? 'GBP'
  const pending = item.status === 'pending'
  const fileSaved = Boolean(item.receiptStored || item.receiptFile?.dataUrl)
  const status = !pending
    ? 'Completed'
    : item.receiptSent
      ? 'Pending review'
      : fileSaved
        ? 'Receipt ready to send'
        : 'Receipt needed'

  return (
    <main className="max-w-3xl">
      <BackLink to="/dashboard" label="Activity" />
      <p className="mt-4 text-sm text-revolut-ink/55">{item.category}</p>
      <h1 className="mt-1 text-3xl font-medium tracking-[-0.04em]">{item.name}</h1>
      <p className={`mt-3 text-4xl font-medium tracking-[-0.04em] tabular-nums ${pending ? 'text-amber-700' : item.amount > 0 ? 'text-emerald-700' : ''}`}>
        {pending ? 'Pending ' : item.amount > 0 ? '+' : ''}
        {formatMoney(item.amount, currency)}
      </p>
      <dl className="mt-8 divide-y divide-revolut-line overflow-hidden rounded-[1.5rem] bg-white">
        <Row label="Status" value={status} />
        <Row label="Date" value={item.date} />
        <Row label="Account" value={account?.name ?? item.accountId} />
        <Row label="Bank" value="Nevolute Inc." />
        <Row label="Category" value={item.category} />
        {item.method ? <Row label="Payment method" value={paymentMethodName(item)} /> : null}
        <Row label="Reference" value={item.id} />
        {pending ? <Row label="Receipt" value={item.receiptName ?? 'Not uploaded'} /> : null}
      </dl>
      {pending && (!item.receiptSent || !fileSaved) && (
        <label className="mt-4 inline-flex cursor-pointer rounded-full bg-revolut-ink px-4 py-2 text-sm font-medium text-white">
          {fileSaved ? 'Replace receipt' : 'Upload receipt'}
          <input
            type="file"
            accept="image/*,.pdf"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (!file) return
              const clientId = loadAccount()?.id || 'primary'
              readStoredFile(file).then((stored) => attachReceipt(item.id, stored, clientId))
            }}
          />
        </label>
      )}
      {pending && (
        <p className="mt-4 max-w-xl text-sm text-revolut-ink/60">
          {item.receiptSent
            ? 'The receipt has been sent and is pending review. Once approved, it can take 1 to 24 hours to show in the account.'
            : 'The balance stays unchanged until support approves the receipt.'}
        </p>
      )}
    </main>
  )
}

function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="text-sm font-medium text-revolut-ink/55 hover:text-revolut-ink">
      {label}
    </Link>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-4 text-sm">
      <dt className="text-revolut-ink/50">{label}</dt>
      <dd className="text-right font-medium break-all">{value}</dd>
    </div>
  )
}
