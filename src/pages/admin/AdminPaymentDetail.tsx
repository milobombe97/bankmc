import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { FilePreview } from '../../components/FilePreview'
import { approvePending, bankAccounts, declinePending, formatMoney, paymentMethodName } from '../../data/banking'
import type { StoredFile } from '../../data/files'
import { findReceiptFile } from '../../data/fileStore'
import { receiptPreview } from '../../data/remote'
import { pendingPayments } from './AdminPaymentsPage'
import { useAdminTick } from './useAdminTick'

function mimeFromName(name: string) {
  const lower = name.toLowerCase()
  if (lower.endsWith('.pdf')) return 'application/pdf'
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.gif')) return 'image/gif'
  return 'image/jpeg'
}

export function AdminPaymentDetail() {
  const { clientId = '', paymentId = '' } = useParams()
  const navigate = useNavigate()
  const tick = useAdminTick()
  const id = decodeURIComponent(paymentId)
  const row = pendingPayments().find((item) => item.clientId === clientId && item.item.id === id)
  const [file, setFile] = useState<StoredFile | undefined>(row?.item.receiptFile)
  void tick

  const txId = row?.item.id ?? ''
  const storedFlag = Boolean(row?.item.receiptStored)
  const inlineUrl = row?.item.receiptFile?.dataUrl ?? ''

  const receiptPath = row?.item.receiptPath ?? ''
  const receiptName = row?.item.receiptName ?? 'Receipt'

  useEffect(() => {
    if (!txId) return
    if (inlineUrl) {
      setFile(row?.item.receiptFile)
      return
    }
    if (!storedFlag && !receiptPath) {
      setFile(undefined)
      return
    }
    let active = true
    findReceiptFile(clientId, txId).then(async (stored) => {
      if (!active) return
      if (stored?.dataUrl) {
        setFile(stored)
        return
      }
      if (receiptPath) {
        const preview = await receiptPreview(receiptPath, receiptName, mimeFromName(receiptName))
        if (active) setFile(preview ?? undefined)
        return
      }
      if (active) setFile(undefined)
    })
    return () => {
      active = false
    }
  }, [clientId, txId, storedFlag, inlineUrl, receiptPath, receiptName, row?.item.receiptFile])

  if (!row) {
    return (
      <main>
        <h1 className="text-3xl font-medium tracking-[-0.04em]">Payment not found</h1>
        <Link to="/admin/payments" className="mt-4 inline-block text-sm font-medium hover:underline">Pending payments</Link>
      </main>
    )
  }

  const account = bankAccounts.find((item) => item.id === row.item.accountId)

  function decide(action: 'approve' | 'decline') {
    if (action === 'approve') approvePending(clientId, id)
    else declinePending(clientId, id)
    navigate('/admin/payments')
  }

  return (
    <main className="max-w-5xl space-y-6">
      <Link to="/admin/payments" className="text-sm font-medium text-revolut-ink/60 hover:text-revolut-ink">Pending payments</Link>
      <div>
        <p className="text-sm text-revolut-ink/55">{row.clientName}</p>
        <h1 className="mt-1 text-3xl font-medium tracking-[-0.04em]">{row.item.name}</h1>
        <p className="mt-2 text-3xl font-medium tabular-nums">
          {account ? formatMoney(row.item.amount, account.currency) : row.item.amount}
        </p>
      </div>
      <section>
        <h2 className="mb-3 text-lg font-medium">Receipt</h2>
        <FilePreview file={file} fallbackName={row.item.receiptName} />
      </section>
      <dl className="grid gap-3 rounded-[1.5rem] bg-white p-5 text-sm sm:grid-cols-2">
        <div><dt className="text-revolut-ink/45">Date</dt><dd>{row.item.date}</dd></div>
        <div><dt className="text-revolut-ink/45">Account</dt><dd>{account?.name ?? row.item.accountId}</dd></div>
        <div><dt className="text-revolut-ink/45">Method</dt><dd>{paymentMethodName(row.item)}</dd></div>
        <div><dt className="text-revolut-ink/45">Receipt status</dt><dd>{row.item.receiptSent ? 'Sent for review' : row.item.receiptName ? 'Attached, not sent' : 'Not uploaded'}</dd></div>
      </dl>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => decide('approve')}>Approve</Button>
        <Button type="button" variant="secondary" onClick={() => decide('decline')}>Decline</Button>
      </div>
    </main>
  )
}
