import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAccount } from '../../auth/useAccount'
import { Button } from '../../components/Button'
import { AccountMark } from '../../components/Flags'
import { CountrySelect } from '../../components/CountrySelect'
import { Field } from '../../components/Field'
import { MethodChoices, methodLabel } from '../../components/MethodChoices'
import { FieldIcon, IconText } from '../../components/PasswordInput'
import { SelectMenu } from '../../components/SelectMenu'
import { keepMethod } from '../../data/payoutMethods'
import { DashboardAnalytics } from './DashboardAnalytics'
import {
  accountBalance,
  availableBalance,
  bankAccounts,
  formatMoney,
  loadTransactions,
  recordPending,
  recordTransfer,
  type Currency,
  type Transaction,
} from '../../data/banking'
import { CryptoCurrencySelect, paymentMethodLabel } from '../../components/CryptoCurrencySelect'
import { type CryptoAssetId } from '../../data/cryptoAssets'
import { transferBetweenOwnAccounts, assertTransferAmount, pullFinancialState, transferToUser } from '../../data/finance'
import { supabaseEnabled } from '../../lib/supabase'

function balanceTextClass(formatted: string, size: 'card' | 'hero' | 'inline' = 'card') {
  const len = formatted.length
  if (size === 'hero') {
    if (len > 16) return 'text-3xl sm:text-4xl'
    if (len > 13) return 'text-4xl sm:text-5xl'
    return 'text-4xl sm:text-5xl'
  }
  if (size === 'inline') {
    if (len > 16) return 'text-sm'
    if (len > 13) return 'text-base'
    return 'text-lg'
  }
  if (len > 16) return 'text-sm'
  if (len > 13) return 'text-base'
  return 'text-lg'
}

function BalanceAmount({
  amount,
  currency,
  size = 'card',
  className = '',
}: {
  amount: number
  currency: Currency
  size?: 'card' | 'hero' | 'inline'
  className?: string
}) {
  const text = formatMoney(amount, currency)
  return (
    <p
      className={`font-medium tabular-nums tracking-tight ${balanceTextClass(text, size)} ${className}`}
      title={text}
    >
      {text}
    </p>
  )
}

export function DashboardHome() {
  const account = useAccount()
  const [query, setQuery] = useState('')
  const [ledgerTick, setLedgerTick] = useState(0)
  const transactions = useMemo(() => loadTransactions(), [ledgerTick])

  useEffect(() => {
    const sync = () => setLedgerTick((tick) => tick + 1)
    window.addEventListener('ledger-changed', sync)
    return () => window.removeEventListener('ledger-changed', sync)
  }, [])

  useEffect(() => {
    if (!account?.id || !supabaseEnabled()) return
    void pullFinancialState(account.id)
  }, [account?.id])

  const usdAccount = bankAccounts.find((item) => item.id === 'usd') ?? bankAccounts[0]
  const usdTotal = accountBalance(usdAccount, account?.id)
  const visible = transactions.filter((item) =>
    item.name.toLowerCase().includes(query.trim().toLowerCase()),
  )

  return (
    <main className="space-y-6">
      <p className="text-sm text-revolut-ink/55">Good to see you</p>
      <h1 className="mt-1 text-3xl font-medium tracking-[-0.04em]">
        {account?.firstName}, your accounts
      </h1>

      <CashBackBanner />

      <section className="space-y-4">
        <div className="flex flex-col gap-6 rounded-[1.75rem] bg-revolut-ink p-6 text-white sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm text-white/60">Total in USD</p>
            <BalanceAmount amount={usdTotal} currency="USD" size="hero" className="mt-2 text-white" />
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/dashboard/topup"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-revolut-ink"
            >
              <ActionIcon name="add" />
              Add money
            </Link>
            <Link
              to="/dashboard/withdraw"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-medium text-white"
            >
              <ActionIcon name="withdraw" />
              Withdraw
            </Link>
            <Link
              to="/dashboard/payments"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-medium text-white"
            >
              <ActionIcon name="send" />
              Send
            </Link>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {bankAccounts.map((item) => (
            <article key={item.id} className="flex min-h-[7.5rem] flex-col justify-between gap-3 rounded-2xl bg-white p-4">
              <div className="flex items-start gap-3">
                <AccountMark id={item.id} currency={item.currency} className="size-9 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-tight">{item.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-revolut-ink/50">{item.detail}</p>
                </div>
              </div>
              <BalanceAmount
                amount={accountBalance(item, account?.id)}
                currency={item.currency}
                className="text-right"
              />
            </article>
          ))}
        </div>
      </section>

      <AccountDetails />

      <QuickTransfer onDone={() => setLedgerTick((tick) => tick + 1)} />

      <DashboardAnalytics transactions={transactions} />

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-xl font-medium tracking-[-0.03em]">Recent activity</h2>
          <label className="relative block w-full max-w-xs sm:w-64">
            <span className="sr-only">Search transactions</span>
            <FieldIcon name="search" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search transactions"
              className="w-full rounded-full border border-revolut-line bg-white py-2 pr-4 pl-11 text-sm outline-none focus:border-revolut-ink"
            />
          </label>
        </div>
        <ul className="mt-4 overflow-hidden rounded-[1.5rem] bg-white">
          {visible.length === 0 && (
            <li className="px-5 py-8 text-sm text-revolut-ink/55">No transactions match that search.</li>
          )}
          {visible.map((item) => (
            <TransactionRow key={item.id} item={item} />
          ))}
        </ul>
      </section>
    </main>
  )
}

const CASHBACK_KEY = 'revolut-clone-cashback-dismissed'

function CashBackBanner() {
  const [open, setOpen] = useState(() => localStorage.getItem(CASHBACK_KEY) !== '1')
  if (!open) return null

  function dismiss() {
    localStorage.setItem(CASHBACK_KEY, '1')
    setOpen(false)
  }

  return (
    <div className="cashback-frame rounded-[1.9rem] p-[2px]">
    <section className="flex flex-col gap-4 rounded-[1.75rem] bg-white px-5 py-5 sm:flex-row sm:items-center sm:gap-6 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <p className="grid size-14 shrink-0 place-items-center rounded-2xl bg-revolut-ink text-lg font-medium tracking-[-0.03em] text-white">
          1%
        </p>
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-[0.08em] text-revolut-ink/60 uppercase">Cash back</p>
          <h2 className="mt-1 text-2xl font-medium tracking-[-0.03em]">1% back on card spend</h2>
          <p className="mt-1 text-sm text-revolut-ink/70">
            1% back on card spend this month.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          to="/dashboard/cards"
          className="inline-flex items-center justify-center rounded-full bg-revolut-ink px-5 py-2.5 text-sm font-medium text-white"
        >
          View card
        </Link>
        <button
          type="button"
          className="rounded-full px-4 py-2.5 text-sm font-medium text-revolut-ink/70 hover:text-revolut-ink"
          onClick={dismiss}
        >
          Not now
        </button>
      </div>
    </section>
    </div>
  )
}

function AccountDetails() {
  const profile = useAccount()
  const [accountId, setAccountId] = useState(bankAccounts[0].id)
  const [copied, setCopied] = useState('')
  const account = bankAccounts.find((item) => item.id === accountId) ?? bankAccounts[0]
  const balance = accountBalance(account, profile?.id)

  function copyField(label: string, value: string) {
    const text = value.trim()
    const fallback = () => {
      const area = document.createElement('textarea')
      area.value = text
      area.setAttribute('readonly', '')
      area.style.position = 'fixed'
      area.style.left = '-9999px'
      document.body.appendChild(area)
      area.select()
      document.execCommand('copy')
      area.remove()
    }
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(text).catch(fallback)
    } else {
      fallback()
    }
    setCopied(label)
    window.setTimeout(() => setCopied((current) => (current === label ? '' : current)), 1400)
  }

  return (
    <section className="rounded-[1.75rem] bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-4 border-b border-revolut-line pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-medium tracking-[-0.03em]">Account details</h2>
          <p className="mt-1 text-sm text-revolut-ink/55">Nevolute Inc. banking details for incoming transfers.</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-revolut-ink/45">Posted balance</p>
          <BalanceAmount amount={balance} currency={account.currency} size="inline" className="mt-1" />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {bankAccounts.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={item.id === account.id}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition ${
              item.id === account.id ? 'bg-revolut-ink text-white' : 'bg-revolut-muted text-revolut-ink/70 hover:text-revolut-ink'
            }`}
            onClick={() => setAccountId(item.id)}
          >
            <AccountMark id={item.id} currency={item.currency} />
            {item.name}
          </button>
        ))}
      </div>
      <dl className="mt-5 overflow-hidden rounded-2xl border border-revolut-line">
        {account.fields.map((field, index) => (
          <div
            key={field.label}
            className={`grid gap-2 px-4 py-3.5 sm:grid-cols-[9rem_minmax(0,1fr)_4.5rem] sm:items-center sm:gap-4 ${
              index > 0 ? 'border-t border-revolut-line' : ''
            }`}
          >
            <dt className="text-xs font-medium uppercase tracking-wide text-revolut-ink/45">{field.label}</dt>
            <dd className="min-w-0 break-all font-medium tabular-nums text-sm sm:text-base">{field.value}</dd>
            <dd className="sm:text-right">
              <button
                type="button"
                className="text-xs font-medium text-revolut-ink/55 hover:text-revolut-ink"
                onClick={() => copyField(field.label, field.value)}
              >
                {copied === field.label ? 'Copied' : 'Copy'}
              </button>
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-revolut-ink/45">Tap copy beside any value to paste it into your bank or wallet app.</p>
    </section>
  )
}

function ActionIcon({ name }: { name: 'add' | 'withdraw' | 'send' }) {
  return (
    <svg viewBox="0 0 20 20" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {name === 'add' && (
        <>
          <circle cx="10" cy="10" r="6.25" />
          <path d="M10 7.25v5.5M7.25 10h5.5" />
        </>
      )}
      {name === 'withdraw' && (
        <>
          <path d="M10 3.5v7.5" />
          <path d="M7 6.5 10 3.5l3 3" />
          <path d="M4.5 11.5h11v4.5h-11z" />
        </>
      )}
      {name === 'send' && (
        <>
          <path d="M4 10h11.5" />
          <path d="M12 6.5 15.5 10 12 13.5" />
        </>
      )}
    </svg>
  )
}

function QuickTransfer({ onDone }: { onDone: () => void }) {
  const profile = useAccount()
  const [country, setCountry] = useState(profile?.kyc?.country || 'United Kingdom')
  const [fromId, setFromId] = useState('usd')
  const [toId, setToId] = useState('external')
  const [recipient, setRecipient] = useState('')
  const [method, setMethod] = useState(() => keepMethod(country, 'fps'))
  const [coin, setCoin] = useState<CryptoAssetId>('BTC')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState('')

  const source = bankAccounts.find((item) => item.id === fromId) ?? bankAccounts[0]
  const ownAccounts = bankAccounts.filter(
    (item) => item.id !== source.id && item.currency === source.currency,
  )
  const destination = toId === 'external' ? null : ownAccounts.find((item) => item.id === toId) ?? ownAccounts[0]

  useEffect(() => {
    if (!profile?.id || !supabaseEnabled()) return
    void pullFinancialState(profile.id)
  }, [profile?.id])

  useEffect(() => {
    setMethod((current) => keepMethod(country, current))
  }, [country])

  function chooseFrom(nextId: string) {
    const next = bankAccounts.find((item) => item.id === nextId) ?? bankAccounts[0]
    const nextOwn = bankAccounts.filter((item) => item.id !== next.id && item.currency === next.currency)
    setFromId(next.id)
    setToId((current) =>
      current !== 'external' && nextOwn.some((item) => item.id === current) ? current : (nextOwn[0]?.id ?? 'external'),
    )
    setError('')
    setSent('')
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const value = Math.round(Number(amount) * 100) / 100
    const external = !destination
    const payee = recipient.trim()
    if (external && payee.length < 2) {
      setError('Enter who you are paying.')
      setSent('')
      return
    }
    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter an amount greater than zero.')
      setSent('')
      return
    }
    if (profile?.id && supabaseEnabled()) {
      const limit = await assertTransferAmount(profile.id, source.id, value)
      if (limit?.error) {
        setError(limit.error)
        setSent('')
        return
      }
    } else {
      const ceiling = external ? availableBalance(source, profile?.id) : accountBalance(source, profile?.id)
      if (value > ceiling) {
        setError('That is more than the balance on this account.')
        setSent('')
        return
      }
    }
    const name = external ? payee : destination.name
    const methodText = `${paymentMethodLabel(country, method, methodLabel, coin)} · ${country}`
    const activityName = external ? `${name} · ${methodText}` : `To ${name}`
    if (external && payee.includes('@')) {
      const result = await transferToUser(source.id, payee, value, activityName)
      if ('error' in result && result.error) {
        setError(result.error)
        setSent('')
        return
      }
      if ('localOnly' in result && result.localOnly) {
        setError('Connect Supabase to send to another Nevolute customer by email.')
        return
      }
      setSent(`Transfer of ${formatMoney(value, source.currency)} to ${payee} is pending verification.`)
    } else if (external) {
      recordPending({
        accountId: source.id,
        name: activityName,
        method: methodText,
        amount: -value,
      })
      setSent('')
    } else {
      const result = await transferBetweenOwnAccounts(source.id, destination.id, value, activityName)
      if ('error' in result && result.error) {
        setError(result.error)
        setSent('')
        return
      }
      if ('localOnly' in result && result.localOnly) {
        recordTransfer({
          fromId: source.id,
          toId: destination.id,
          name: activityName,
          amount: value,
        })
      }
      setSent(`${formatMoney(value, source.currency)} to ${name}`)
    }
    setAmount('')
    setRecipient('')
    setError('')
    onDone()
  }

  return (
    <section className="rounded-[1.75rem] bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-medium tracking-[-0.03em]">Quick transfer</h2>
          <p className="mt-1 text-sm text-revolut-ink/55">
            Move money between your accounts, or send it to someone else.
          </p>
        </div>
        <Link to="/dashboard/payments" className="text-sm font-medium text-revolut-ink/60 hover:text-revolut-ink">
          Full payment
        </Link>
      </div>
      <form className="mt-5 space-y-3" onSubmit={onSubmit}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:items-end">
          <Field label="From">
            <SelectMenu
              value={source.id}
              onChange={chooseFrom}
              options={bankAccounts.map((item) => ({
                value: item.id,
                label: item.name,
                hint: formatMoney(accountBalance(item), item.currency),
                icon: <AccountMark id={item.id} currency={item.currency} />,
              }))}
            />
          </Field>
          <Field label="To">
            <SelectMenu
              value={destination?.id ?? 'external'}
              onChange={(next) => {
                setToId(next)
                setError('')
                setSent('')
              }}
              options={[
                ...ownAccounts.map((item) => ({
                  value: item.id,
                  label: item.name,
                  icon: <AccountMark id={item.id} currency={item.currency} />,
                })),
                { value: 'external', label: 'Someone else' },
              ]}
            />
          </Field>
          <Field label={`Amount (${source.currency})`}>
            <IconText
              icon="banknote"
              inputMode="decimal"
              value={amount}
              placeholder="0.00"
              onChange={(event) => {
                setAmount(event.target.value)
                setError('')
              }}
            />
          </Field>
        </div>
        {destination === null && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name">
                <IconText
                  icon="user"
                  value={recipient}
                  placeholder="Name or Nevolute email"
                  onChange={(event) => setRecipient(event.target.value)}
                />
              </Field>
              <Field label="Country">
                <CountrySelect value={country} onChange={setCountry} />
              </Field>
            </div>
            <MethodChoices country={country} value={method} onChange={setMethod} basis="destination" />
            {method === 'crypto' && (
              <CryptoCurrencySelect
                value={coin}
                onChange={setCoin}
                hint="Choose which asset you are sending for this transfer."
              />
            )}
          </div>
        )}
        <Button type="submit" className="w-full sm:w-auto">
          Transfer
        </Button>
      </form>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {sent && (
        <p className="mt-3 text-sm font-medium text-emerald-700" role="status">
          Sent {sent}.
        </p>
      )}
    </section>
  )
}

function TransactionRow({ item }: { item: Transaction }) {
  const account = bankAccounts.find((entry) => entry.id === item.accountId)
  const currency = account?.currency ?? 'GBP'
  const positive = item.amount > 0
  return (
    <li className="border-b border-revolut-line last:border-b-0">
      <Link
        to={`/dashboard/activity/${encodeURIComponent(item.id)}`}
        className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-revolut-muted/70"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-revolut-muted text-revolut-ink">
            <CategoryIcon category={item.category} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">{item.name}</p>
            <p className="text-xs text-revolut-ink/50">
              {item.status === 'declined'
                ? `Declined · ${item.date}`
                : item.status === 'approved'
                  ? `Successful · ${item.date}`
                  : item.status === 'pending'
                    ? item.category === 'Withdrawal'
                      ? `Pending verification · ${item.date}`
                      : item.receiptSent
                        ? `Pending · in review · ${item.date}`
                        : item.receiptName
                          ? `Pending · ready to send · ${item.date}`
                          : `Pending · receipt needed · ${item.date}`
                    : `${item.category} · ${item.date}`}
            </p>
          </div>
        </div>
        <p className={`shrink-0 font-medium tabular-nums ${item.status === 'declined' ? 'text-red-700' : item.status === 'pending' ? 'text-amber-700' : positive ? 'text-emerald-700' : ''}`}>
          {item.status === 'declined' ? 'Declined ' : item.status === 'pending' ? 'Pending ' : positive ? '+' : ''}
          {formatMoney(item.amount, currency)}
        </p>
      </Link>
    </li>
  )
}

function CategoryIcon({ category }: { category: string }) {
  const path =
    category === 'Income' || category === 'Top up'
      ? 'M10 15V5M6 9l4-4 4 4'
      : category === 'Transfer'
        ? 'M4 10h12M12 6l4 4-4 4'
        : category === 'Transport'
          ? 'M5 14V7h10v7M7 14v2M13 14v2M5 10h10'
          : category === 'Bills'
            ? 'M6 4h8v12H6zM8 8h4M8 11h4'
            : category === 'Groceries'
              ? 'M5 7h10l-1 9H6L5 7Zm2-2a3 3 0 0 1 6 0'
              : category === 'Savings'
                ? 'M4 14c2-5 10-5 12 0M10 8V5'
                : 'M6 6h8v8H6z'
  return (
    <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={path} />
    </svg>
  )
}
