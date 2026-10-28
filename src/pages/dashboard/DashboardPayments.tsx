import { type FormEvent, useEffect, useState } from 'react'
import { useAccount } from '../../auth/useAccount'
import { accountBalance, availableBalance, bankAccounts, formatMoney, primaryAccountId, recordPending } from '../../data/banking'
import { assertTransferAmount, pullFinancialState, transferToUser } from '../../data/finance'
import { supabaseEnabled } from '../../lib/supabase'
import { keepMethod } from '../../data/payoutMethods'
import { Button } from '../../components/Button'
import { CountrySelect } from '../../components/CountrySelect'
import { AccountMark } from '../../components/Flags'
import { Field } from '../../components/Field'
import { MethodChoices, methodLabel } from '../../components/MethodChoices'
import { IconText } from '../../components/PasswordInput'
import { CryptoCurrencySelect, paymentMethodLabel } from '../../components/CryptoCurrencySelect'
import { SelectMenu } from '../../components/SelectMenu'
import { type CryptoAssetId } from '../../data/cryptoAssets'

export function DashboardPayments() {
  const profile = useAccount()
  const [country, setCountry] = useState(profile?.kyc?.country || 'United Kingdom')
  const [from, setFrom] = useState(primaryAccountId)
  const [recipient, setRecipient] = useState('')
  const [method, setMethod] = useState(() => keepMethod(country, 'fps'))
  const [coin, setCoin] = useState<CryptoAssetId>('BTC')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState('')

  const source = bankAccounts.find((account) => account.id === from) ?? bankAccounts[0]

  useEffect(() => {
    if (!profile?.id || !supabaseEnabled()) return
    void pullFinancialState(profile.id)
  }, [profile?.id])

  useEffect(() => {
    setMethod((current) => keepMethod(country, current))
  }, [country])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const value = Math.round(Number(amount) * 100) / 100
    const target = recipient.trim()
    if (target.length < 2) {
      setError('Enter who you are paying.')
      return
    }
    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter an amount greater than zero.')
      return
    }
    if (profile?.id && supabaseEnabled()) {
      const limit = await assertTransferAmount(profile.id, source.id, value)
      if (limit?.error) {
        setError(limit.error)
        return
      }
    } else if (value > availableBalance(source, profile?.id)) {
      setError('That is more than the balance still available on this account.')
      return
    }
    const label = paymentMethodLabel(country, method, methodLabel, coin)
    if (target.includes('@')) {
      const result = await transferToUser(source.id, target, value, `${target} · ${label} · ${country}`)
      if ('error' in result && result.error) {
        setError(result.error)
        return
      }
      if ('localOnly' in result && result.localOnly) {
        setError('Connect Supabase to send money to another Nevolute customer by email.')
        return
      }
      setSubmitted(`Sent ${formatMoney(value, source.currency)} to ${target}.`)
    } else {
      recordPending({
        accountId: source.id,
        name: `${target} · ${label}`,
        method: label,
        amount: -value,
      })
    }
    setRecipient('')
    setAmount('')
    setError('')
  }

  return (
    <main className="grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
      <div>
        <h1 className="text-3xl font-medium tracking-[-0.04em]">Send money</h1>
        <p className="mt-2 text-sm text-revolut-ink/60">
          Send to another Nevolute customer by email (funds move immediately), or enter a name for an external payment that stays pending until support approves it.
        </p>
        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <Field label="From">
            <SelectMenu
              value={from}
              onChange={setFrom}
              options={bankAccounts.map((account) => ({
                value: account.id,
                label: account.name,
                hint: formatMoney(accountBalance(account, profile?.id), account.currency),
                icon: <AccountMark id={account.id} currency={account.currency} />,
              }))}
            />
          </Field>
          <Field label="Recipient" error={error || undefined}>
            <IconText
              icon="user"
              value={recipient}
              placeholder="Email for Nevolute transfer, or payee name"
              onChange={(event) => setRecipient(event.target.value)}
            />
          </Field>
          <Field label="Country">
            <CountrySelect value={country} onChange={setCountry} />
          </Field>
          <MethodChoices country={country} value={method} onChange={setMethod} basis="destination" />
          {method === 'crypto' && (
            <CryptoCurrencySelect value={coin} onChange={setCoin} hint="Choose which cryptocurrency you are paying with." />
          )}
          <Field label={`Amount (${source.currency})`}>
            <IconText
              icon="banknote"
              inputMode="decimal"
              value={amount}
              placeholder="0.00"
              onChange={(event) => setAmount(event.target.value)}
            />
          </Field>
          <Button type="submit">Send</Button>
          {submitted ? (
            <p className="text-sm font-medium text-amber-800" role="status">
              {submitted}
            </p>
          ) : null}
        </form>
      </div>
      <aside className="rounded-[1.75rem] bg-white p-6">
        <h2 className="font-medium">Available</h2>
        <ul className="mt-4 space-y-3">
          {bankAccounts.map((account) => (
            <li key={account.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2">
                <AccountMark id={account.id} currency={account.currency} />
                {account.name}
              </span>
              <span className="font-medium tabular-nums">{formatMoney(accountBalance(account, profile?.id), account.currency)}</span>
            </li>
          ))}
        </ul>
      </aside>
    </main>
  )
}
