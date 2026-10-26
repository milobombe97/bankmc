export type Topic = {
  eyebrow: string
  title: string
  lead: string
  bullets: string[]
  ctaLabel: string
  ctaHref: string
  heroTheme?: 'dark' | 'light' | 'gradient'
}

export const topics: Record<string, Topic> = {
  accounts: {
    eyebrow: 'Accounts',
    title: 'Everyday accounts from Nevolute Inc.',
    lead: 'Hold, spend, and sort money in personal, joint, and professional accounts. New customers start with a clear balance and their own ledger.',
    bullets: [
      'Personal, joint, and professional accounts',
      'Balances in USD, GBP, and EUR',
      'Account details you can copy when you need them',
      'Activity that stays with your own profile',
    ],
    ctaLabel: 'Open an account',
    ctaHref: '/signup',
  },
  transfers: {
    eyebrow: 'Transfers',
    title: 'Send and receive with Nevolute Inc.',
    lead: 'Move money between your own accounts, or send it to someone else. External payments stay pending until Nevolute Inc. reviews them.',
    bullets: [
      'Transfers between your own accounts',
      'International and local send options',
      'Methods that follow the destination country',
      'A receipt when a payment needs review',
    ],
    ctaLabel: 'Open an account',
    ctaHref: '/signup',
    heroTheme: 'dark',
  },
  spend: {
    eyebrow: 'Spending',
    title: 'Spending tools that stay in one place',
    lead: 'Cards, linked accounts, and everyday money management sit beside your Nevolute Inc. balance, so spending is easier to follow.',
    bullets: [
      'Physical and virtual cards',
      'Points on eligible spend',
      'Linked accounts and shops',
      'Spending grouped by category',
    ],
    ctaLabel: 'See cards',
    ctaHref: '/cards',
  },
  travel: {
    eyebrow: 'Travel',
    title: 'Travel extras with Nevolute Inc.',
    lead: 'Lounge access and travel cover sit with the plan you choose. Availability and benefits depend on the plan.',
    bullets: [
      'Lounge access on selected plans',
      'Travel cover explained before you buy',
      'Spend abroad from the same account',
      'Plan comparison before you upgrade',
    ],
    ctaLabel: 'Compare plans',
    ctaHref: '/plans',
    heroTheme: 'light',
  },
  crypto: {
    eyebrow: 'Crypto',
    title: 'Crypto with Nevolute Inc.',
    lead: 'Buy, sell, and move crypto from the same Nevolute Inc. account you use for everyday money. This is a demo of the flow, not a live exchange.',
    bullets: [
      'Crypto as a send and withdraw method',
      'Nevolute Ramp for moving between cash and crypto',
      'Nevolute X for the exchange view',
      'No live wallet keys are stored in this demo',
    ],
    ctaLabel: 'Open an account',
    ctaHref: '/signup',
    heroTheme: 'dark',
  },
  mobile: {
    eyebrow: 'Mobile',
    title: 'Stay connected with Nevolute Inc.',
    lead: 'Mobile and data plans are part of the wider Nevolute Inc. offer. Pick a plan, then manage it beside your accounts.',
    bullets: [
      'Mobile plans for everyday use',
      'Data plans for travel',
      'One login for money and connectivity',
      'Plan details before you switch',
    ],
    ctaLabel: 'Compare plans',
    ctaHref: '/plans',
  },
  help: {
    eyebrow: 'Help',
    title: 'Help from Nevolute Inc.',
    lead: 'Questions about an account, a payment, or the product go to the Nevolute Inc. support team. This demo does not connect to a live help desk.',
    bullets: [
      'Contact support@nevolute.inc',
      'Help topics for accounts, cards, and payments',
      'Status of reviews shown in your account',
      'Developer notes for the demo API surface',
    ],
    ctaLabel: 'Email support',
    ctaHref: 'mailto:support@nevolute.inc',
    heroTheme: 'light',
  },
  legal: {
    eyebrow: 'Legal',
    title: 'Legal information for Nevolute Inc.',
    lead: 'These pages describe how the Nevolute Inc. demo presents accounts, payments, and personal information. They are not a live bank agreement.',
    bullets: [
      'Website terms for this demo',
      'How profile and payment details are stored',
      'Where to send a complaint: support@nevolute.inc',
      'Privacy limited to what the demo account needs',
    ],
    ctaLabel: 'Contact support',
    ctaHref: 'mailto:support@nevolute.inc',
    heroTheme: 'light',
  },
}
