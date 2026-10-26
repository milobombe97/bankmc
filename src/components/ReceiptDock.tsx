import { useEffect, useMemo, useRef, useState } from 'react'
import { useAccount } from '../auth/useAccount'
import { attachReceipt, loadClientTransactions, markReceiptSent, paymentMethodName } from '../data/banking'
import { DepositNotice } from './DepositNotice'

function dockKey(clientId: string) {
  return `revolut-clone-receipt-minimized:${clientId}`
}

export function ReceiptDock() {
  const account = useAccount()
  const clientId = account?.id || ''
  const [tick, setTick] = useState(0)
  const [minimized, setMinimized] = useState(() => (clientId ? localStorage.getItem(dockKey(clientId)) === '1' : false))
  const pending = useMemo(
    () => (clientId ? loadClientTransactions(clientId).filter((item) => item.status === 'pending') : []),
    [clientId, tick],
  )
  const countRef = useRef(pending.length)

  useEffect(() => {
    if (!clientId) return
    setMinimized(localStorage.getItem(dockKey(clientId)) === '1')
  }, [clientId])

  useEffect(() => {
    const sync = () => setTick((value) => value + 1)
    window.addEventListener('ledger-changed', sync)
    window.addEventListener('account-changed', sync)
    return () => {
      window.removeEventListener('ledger-changed', sync)
      window.removeEventListener('account-changed', sync)
    }
  }, [])

  useEffect(() => {
    if (pending.length > countRef.current) {
      setMinimized(false)
      if (clientId) localStorage.setItem(dockKey(clientId), '0')
    }
    countRef.current = pending.length
  }, [clientId, pending.length])

  if (!account?.email || pending.length === 0) return null

  function minimize() {
    setMinimized(true)
    localStorage.setItem(dockKey(clientId), '1')
  }

  function expand() {
    setMinimized(false)
    localStorage.setItem(dockKey(clientId), '0')
  }

  if (minimized) {
    const label = pending.length === 1 ? 'Receipt pending' : `${pending.length} receipts pending`
    return (
      <button
        type="button"
        className="fixed top-1/2 right-0 z-50 -translate-y-1/2 rounded-l-2xl bg-revolut-ink px-2.5 py-4 text-xs font-medium text-white shadow-[0_8px_24px_rgba(25,28,31,0.25)] [writing-mode:vertical-rl]"
        onClick={expand}
      >
        {label}
      </button>
    )
  }

  return (
    <aside className="fixed right-4 bottom-4 z-50 flex max-h-[min(34rem,calc(100vh-2rem))] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-revolut-line bg-white shadow-[0_16px_40px_rgba(25,28,31,0.18)]">
      <div className="flex items-center justify-between gap-3 border-b border-revolut-line px-4 py-3">
        <p className="text-sm font-medium">
          {pending.length === 1 ? 'Receipt' : `${pending.length} receipts`}
        </p>
        <button type="button" className="text-sm text-revolut-ink/55 hover:text-revolut-ink" onClick={minimize}>
          Minimize
        </button>
      </div>
      <div className="space-y-3 overflow-y-auto p-3">
        {pending.map((item) => (
          <DepositNotice
            key={item.id}
            method={paymentMethodName(item)}
            email={account.email}
            receiptName={item.receiptName}
            stored={Boolean(item.receiptStored || item.receiptFile?.dataUrl)}
            sent={item.receiptSent}
            onUpload={(receiptName) => attachReceipt(item.id, receiptName, clientId)}
            onSend={() => markReceiptSent(item.id, clientId)}
          />
        ))}
      </div>
    </aside>
  )
}
