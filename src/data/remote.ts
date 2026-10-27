import { adoptRemoteAdmin, type AdminUser } from '../auth/admins'
import { saveAccount, saveClients, type Account, type KycStatus } from '../auth/session'
import { ledgerKey, type Transaction } from './banking'
import type { StoredFile } from './files'
import { kycFileKey, saveStoredFile } from './fileStore'
import { supabase } from '../lib/supabase'

type ProfileRow = {
  id: string
  first_name: string
  last_name: string
  phone: string
  email: string
  role: 'client' | 'admin' | 'super'
  suspended: boolean
  kyc_status: KycStatus
  kyc: Account['kyc']
  settings: Account['settings']
}

type TransactionRow = {
  id: string
  user_id: string
  account_id: string
  name: string
  category: string
  amount: number
  date: string
  status: string | null
  method: string | null
  receipt_name: string | null
  receipt_path: string | null
  receipt_sent: boolean
}

function accountFromProfile(row: ProfileRow, email: string, signedIn: boolean): Account {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email || email,
    phone: row.phone,
    password: '',
    signedIn,
    suspended: row.suspended,
    role: row.role,
    kycStatus: row.kyc_status,
    kyc: row.kyc ?? undefined,
    settings: row.settings ?? undefined,
  }
}

function profilePatch(account: Account) {
  const kyc = account.kyc
  const storedKyc = kyc
    ? {
        ...kyc,
        documentFile: undefined,
        documentBackFile: undefined,
      }
    : null
  return {
    first_name: account.firstName,
    last_name: account.lastName,
    phone: account.phone,
    email: account.email,
    suspended: Boolean(account.suspended),
    kyc_status: account.kycStatus,
    kyc: storedKyc,
    settings: account.settings ?? null,
  }
}

export async function signUpWithSupabase(account: Account): Promise<{ error?: string; account?: Account }> {
  if (!supabase) return { error: 'Supabase is not configured.' }
  
  // 1. Sign up the user in Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email: account.email,
    password: account.password,
    options: { data: { first_name: account.firstName, last_name: account.lastName } },
  })
  
  if (error) return { error: error.message }
  if (!data.user) {
    return { error: 'Signup failed to return a user object.' }
  }

  const next = { ...account, id: data.user.id, password: '', signedIn: Boolean(data.session) }

  // 2. Explicitly insert/upsert the profile row right from the client
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: data.user.id,
    email: next.email,
    first_name: next.firstName,
    last_name: next.lastName,
    phone: next.phone || '',
    role: 'client',
    suspended: false,
    kyc_status: 'not_started',
  })

  if (profileError) {
    console.error('Explicit profile creation error:', profileError)
    return { error: `Signup succeeded, but profile creation failed: ${profileError.message}` }
  }

  saveAccount(next)
  return { account: next }
}

export async function signInWithSupabase(email: string, password: string): Promise<{ error?: string; account?: Account }> {
  if (!supabase) return { error: 'Supabase is not configured.' }
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
  if (error || !data.user) return { error: error?.message ?? 'Email or password was not accepted.' }
  const profile = await loadProfile(data.user.id, data.user.email ?? email, true)
  if (!profile) return { error: 'The profile row was not created. Run the SQL setup.' }
  saveAccount(profile)
  await pullTransactions(profile.role === 'client' ? profile.id : undefined)
  if (profile.role === 'admin' || profile.role === 'super') await pullClients()
  return { account: profile }
}

export async function signInStaff(email: string, password: string): Promise<{ error?: string; admin?: AdminUser }> {
  const result = await signInWithSupabase(email, password)
  if (result.error || !result.account) return { error: result.error ?? 'Sign-in failed.' }
  if (result.account.role !== 'admin' && result.account.role !== 'super') {
    await supabase?.auth.signOut()
    return { error: 'This email is a client account.' }
  }
  const admin: AdminUser = {
    id: result.account.id || '',
    firstName: result.account.firstName,
    lastName: result.account.lastName,
    email: result.account.email,
    password: '',
    role: result.account.role,
  }
  adoptRemoteAdmin(admin)
  return { admin }
}

export async function restoreSupabaseSession() {
  if (!supabase) return
  const { data } = await supabase.auth.getSession()
  const user = data.session?.user
  if (!user) return
  const profile = await loadProfile(user.id, user.email ?? '', true)
  if (!profile) return
  if (profile.role === 'admin' || profile.role === 'super') {
    adoptRemoteAdmin({
      id: profile.id || user.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      password: '',
      role: profile.role,
    })
    await pullClients()
    await pullTransactions()
    return
  }
  saveAccount(profile)
  await pullTransactions(profile.id)
}

async function loadProfile(id: string, email: string, signedIn: boolean) {
  if (!supabase) return null
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
  if (error || !data) return null
  return accountFromProfile(data as ProfileRow, email, signedIn)
}

export async function updateOwnPassword(current: string, next: string) {
  if (!supabase) return {}
  const { data } = await supabase.auth.getUser()
  const email = data.user?.email
  if (!email) return { error: 'Sign in again before changing the password.' }
  const check = await supabase.auth.signInWithPassword({ email, password: current })
  if (check.error) return { error: 'That does not match your current password.' }
  const { error } = await supabase.auth.updateUser({ password: next })
  return { error: error?.message }
}

export async function pushProfile(account: Account) {
  if (!supabase || !account.id) return
  const { data } = await supabase.auth.getUser()
  if (!data.user) return
  await supabase.from('profiles').update(profilePatch(account)).eq('id', account.id)
}

export async function pushTransactions(clientId: string | undefined, entries: Transaction[]) {
  if (!supabase) return
  const { data } = await supabase.auth.getUser()
  const userId = clientId && clientId !== 'primary' ? clientId : data.user?.id
  if (!userId || !data.user) return
  if (entries.length === 0) {
    await supabase.from('transactions').delete().eq('user_id', userId)
    return
  }
  const rows: TransactionRow[] = entries.map((item) => ({
    id: item.id,
    user_id: userId,
    account_id: item.accountId,
    name: item.name,
    category: item.category,
    amount: item.amount,
    date: item.date,
    status: item.status ?? null,
    method: item.method ?? null,
    receipt_name: item.receiptName ?? null,
    receipt_path: item.receiptPath ?? null,
    receipt_sent: Boolean(item.receiptSent),
  }))
  await supabase.from('transactions').upsert(rows)
  const { data: existing } = await supabase.from('transactions').select('id').eq('user_id', userId)
  const keep = new Set(entries.map((item) => item.id))
  const remove = (existing ?? []).map((row) => row.id).filter((id) => !keep.has(id))
  if (remove.length > 0) await supabase.from('transactions').delete().in('id', remove)
}

export async function uploadReceipt(clientId: string, transactionId: string, file: StoredFile, amount: number) {
  if (!supabase || !file.dataUrl) return undefined
  const { data } = await supabase.auth.getUser()
  if (!data.user) return undefined
  const owner = clientId && clientId !== 'primary' ? clientId : data.user.id
  if (owner !== data.user.id) return undefined
  
  const path = `${data.user.id}/${transactionId}`
  const response = await fetch(file.dataUrl)
  const blob = await response.blob()
  
  // 1. Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage.from('receipts').upload(path, blob, {
    upsert: true,
    contentType: file.type || blob.type,
  })
  
  if (uploadError) {
    console.error('Storage upload error:', uploadError)
    return undefined
  }

  // 2. Get the Public URL of the uploaded image
  const { data: publicUrlData } = supabase.storage
    .from('receipts')
    .getPublicUrl(path)

  const imageUrl = publicUrlData.publicUrl

  // 3. Insert into the receipts table so the webhook fires with the image URL!
  const { error: insertError } = await supabase
    .from('receipts')
    .insert({
      user_id: owner,
      amount: amount,
      image_url: imageUrl,
      status: 'pending'
    })

  if (insertError) {
    console.error('Receipt table insert error:', insertError)
    return undefined
  }

  return path
}

export async function storeKycDocuments(clientId: string, kyc: Account['kyc']) {
  if (!kyc) return kyc
  const next = { ...kyc }
  const front = await keepKycSide(clientId, 'front', kyc.documentFile)
  const back = await keepKycSide(clientId, 'back', kyc.documentBackFile)
  if (front.stored) {
    next.documentStored = true
    next.documentPath = front.path || kyc.documentPath
    delete next.documentFile
  }
  if (back.stored) {
    next.documentBackStored = true
    next.documentBackPath = back.path || kyc.documentBackPath
    delete next.documentBackFile
  }
  return next
}

async function keepKycSide(clientId: string, side: 'front' | 'back', file?: StoredFile) {
  if (!file?.dataUrl) return { stored: false as const }
  await saveStoredFile(kycFileKey(clientId, side), file)
  const path = await uploadKyc(clientId, side, file)
  return { stored: true as const, path }
}

async function uploadKyc(clientId: string, side: 'front' | 'back', file: StoredFile) {
  if (!supabase || !file.dataUrl) return undefined
  const { data } = await supabase.auth.getUser()
  if (!data.user) return undefined
  const owner = clientId && clientId !== 'primary' ? clientId : data.user.id
  if (owner !== data.user.id) return undefined
  const path = `${data.user.id}/${side}`
  const response = await fetch(file.dataUrl)
  const blob = await response.blob()
  const { error } = await supabase.storage.from('kyc').upload(path, blob, {
    upsert: true,
    contentType: file.type || blob.type,
  })
  return error ? undefined : path
}

export async function kycPreview(path: string, name: string, type: string) {
  if (!supabase) return null
  const { data, error } = await supabase.storage.from('kyc').createSignedUrl(path, 6030)
  if (error || !data?.signedUrl) return null
  const file: StoredFile = { name, type: type || 'image/jpeg', dataUrl: data.signedUrl }
  return file
}

export async function receiptPreview(path: string, name: string, type: string) {
  if (!supabase) return null
  const { data, error } = await supabase.storage.from('receipts').createSignedUrl(path, 6030)
  if (error || !data?.signedUrl) return null
  const file: StoredFile = { name, type: type || 'image/jpeg', dataUrl: data.signedUrl }
  return file
}

async function pullTransactions(userId?: string) {
  if (!supabase) return
  let query = supabase.from('transactions').select('*')
  if (userId) query = query.eq('user_id', userId)
  const { data, error } = await query
  if (error || !data) return
  const groups = new Map<string, Transaction[]>()
  for (const row of data as TransactionRow[]) {
    const list = groups.get(row.user_id) ?? []
    list.push({
      id: row.id,
      accountId: row.account_id,
      name: row.name,
      category: row.category,
      amount: Number(row.amount),
      date: row.date,
      status: row.status === 'pending' || row.status === 'approved' || row.status === 'declined' ? row.status : undefined,
      method: row.method ?? undefined,
      receiptName: row.receipt_name ?? undefined,
      receiptPath: row.receipt_path ?? undefined,
      receiptStored: Boolean(row.receipt_path),
      receiptSent: row.receipt_sent,
    })
    groups.set(row.user_id, list)
  }
  if (userId && !groups.has(userId)) groups.set(userId, [])
  for (const [id, entries] of groups) {
    localStorage.setItem(ledgerKey(id), JSON.stringify(entries))
  }
  window.dispatchEvent(new Event('ledger-changed'))
}

async function pullClients() {
  if (!supabase) return
  const { data, error } = await supabase.from('profiles').select('*').eq('role', 'client')
  if (error || !data) return
  const accounts = (data as ProfileRow[]).map((row) => accountFromProfile(row, row.email, false))
  saveClients(accounts)
}