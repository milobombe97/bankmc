import { MarketingSubPage } from '../MarketingSubPage'

export function KidsTeensPage() {
  return (
    <MarketingSubPage
      eyebrow="Kids & Teens"
      title="Money skills for the next generation"
      lead="Accounts for ages 16–17, plus tools for parents and guardians to guide spending, saving, and learning — safely."
      heroTheme="light"
      bullets={[
        'Dedicated experiences for teens and younger users',
        'Parental controls and visibility',
        'Cards designed for everyday learning',
        'Savings goals and allowances in one app',
      ]}
      ctaLabel="Get started"
    />
  )
}
