import { MarketingSubPage } from '../MarketingSubPage'

export function SavingsPage() {
  return (
    <MarketingSubPage
      eyebrow="Savings"
      title="Life, meets savings"
      lead="Grow your money with up to 4% AER (variable) on Instant Access Savings, with interest paid every day. Rates vary by plan."
      bullets={[
        'Instant Access Savings with daily interest',
        'Goals for adventure, weddings, moving, and more',
        'Rates that scale with your plan',
        'Clear T&Cs and partner disclosures',
      ]}
      ctaLabel="Explore Savings"
      ctaHref="/#savings"
    />
  )
}
