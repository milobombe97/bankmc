import { MarketingSubPage } from '../MarketingSubPage'

export function InvestPage() {
  return (
    <MarketingSubPage
      eyebrow="Investments"
      title="Explore 5,000+ stocks and ETFs"
      lead="Invest in leading companies commission-free within your monthly allowance. Other fees may apply. Capital at risk."
      heroTheme="light"
      bullets={[
        'Stocks and ETFs in one place',
        'Commission-free trades within allowance',
        'Clear risk disclosures and FAQs',
        'Execution-only service — no personal advice',
      ]}
      ctaLabel="Download the app"
    />
  )
}
