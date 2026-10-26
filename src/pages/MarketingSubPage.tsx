import { Button } from '../components/Button'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { Reveal } from '../components/Reveal'
import { DisplayTitle, SectionLead, SectionTitle } from '../components/Typography'

export type MarketingSubPageProps = {
  eyebrow?: string
  title: string
  lead: string
  heroTheme?: 'dark' | 'light' | 'gradient'
  bullets?: string[]
  ctaLabel?: string
  ctaHref?: string
}

export function MarketingSubPage({
  eyebrow,
  title,
  lead,
  heroTheme = 'gradient',
  bullets = [],
  ctaLabel = 'Download the app',
  ctaHref = '#download',
}: MarketingSubPageProps) {
  const heroClass =
    heroTheme === 'dark'
      ? 'bg-revolut-ink text-white'
      : heroTheme === 'light'
        ? 'bg-revolut-muted text-revolut-ink'
        : 'bg-gradient-to-b from-[#9ec8ef] via-revolut-sky-hero to-[#6aa8de] text-white'

  const headerTheme = heroTheme === 'light' ? 'light' : 'dark'

  return (
    <div className="bg-white">
      <section className={`relative pb-20 pt-24 lg:pb-28 lg:pt-28 ${heroClass}`}>
        <Header theme={headerTheme} />
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          {eyebrow && (
            <p
              className={`type-label uppercase tracking-[0.12em] ${
                heroTheme === 'light' ? 'text-revolut-ink/50' : 'text-white/70'
              }`}
            >
              {eyebrow}
            </p>
          )}
          <DisplayTitle className={`mt-4 max-w-4xl ${heroTheme === 'light' ? '!text-revolut-ink' : ''}`}>
            {title}
          </DisplayTitle>
          <SectionLead
            className={`mt-6 max-w-2xl ${heroTheme === 'light' ? '!text-revolut-ink/70' : '!text-white/85'}`}
          >
            {lead}
          </SectionLead>
          <Button className="mt-10" href={ctaHref}>{ctaLabel}</Button>
        </div>
      </section>

      {bullets.length > 0 && (
        <section className="py-20 lg:py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <Reveal>
              <SectionTitle>What you get</SectionTitle>
            </Reveal>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {bullets.map((item, i) => (
                <Reveal key={item} delay={i * 0.06}>
                  <li className="rounded-2xl border border-revolut-line bg-revolut-muted/60 p-6 text-revolut-ink/80">
                    {item}
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}

      <Footer />
    </div>
  )
}
