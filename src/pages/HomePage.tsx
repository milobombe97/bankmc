import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { CookieBanner } from '../components/CookieBanner'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { BadgeCard, Marquee } from '../components/Marquee'
import { PlansShowcase } from '../components/PlansCarousel'
import { FadeIn, Reveal } from '../components/Reveal'
import { SectionLead, SectionTitle } from '../components/Typography'
import { trustBadges } from '../data/badges'
import { images } from '../data/images'
import { personalPlans } from '../data/plans'

const lifeTabs = ['Adventure', 'Wedding', 'Moving'] as const

export function HomePage() {
  const [lifeTab, setLifeTab] = useState<(typeof lifeTabs)[number]>('Adventure')
  const [cardTab, setCardTab] = useState<'Physical cards' | 'Virtual cards'>('Physical cards')
  const reduceMotion = useReducedMotion()

  return (
    <div className="bg-white">
      <section className="relative flex h-[100svh] min-h-[720px] flex-col overflow-hidden bg-[#79b4e6] text-white">
        <img
          src={images.heroPortrait}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
        <Header theme="dark" />

        <div className="relative mx-auto flex w-full max-w-[1200px] flex-1 flex-col px-5 pt-24 lg:px-8 lg:pt-28">
          <h1 className="relative z-0 shrink-0 text-center text-[clamp(3.4rem,7.4vw,6.6rem)] font-medium leading-[0.92] tracking-[-0.045em] text-white">
            Banking &amp; Beyond
          </h1>

          <div className="relative grid min-h-0 flex-1 xl:grid-cols-[minmax(0,1fr)_minmax(320px,560px)_minmax(0,1fr)]">
            <FadeIn delay={0.12} className="relative z-20 mx-auto max-w-md pt-8 text-center xl:mx-0 xl:max-w-[340px] xl:pt-16 xl:text-left">
              <p className="text-[1.05rem] leading-snug text-white">
                This is your bank, redefined. Get powerful daily banking and global freedom. Sign up
                for free in a tap.
              </p>
              <div className="mt-8 flex justify-center xl:justify-start">
                <Button href="/signup">Open an account</Button>
              </div>
            </FadeIn>

            <div className="relative z-10 h-full min-h-[420px]">
              <img
                src={images.heroSky}
                alt=""
                className="absolute -top-28 left-1/2 h-[calc(100%+7rem)] w-[115%] max-w-none -translate-x-1/2 object-cover object-[62%_8%]"
              />
              <div className="pointer-events-none absolute left-1/2 top-[36%] w-[62%] -translate-x-1/2 rounded-[1.6rem] border border-white/75 px-4 pb-7 pt-8 text-center">
                <p className="text-sm font-medium text-white">Personal</p>
                <p className="mt-1 text-[2.75rem] font-medium leading-none tracking-[-0.04em]">
                  £6,012
                </p>
                <Link
                  to="/accounts"
                  className="pointer-events-auto mt-3 inline-flex rounded-full bg-white px-5 py-2 text-sm font-medium text-revolut-ink"
                >
                  Accounts
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="salary" className="border-b border-revolut-line bg-white py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-2 lg:px-8">
          <Reveal>
            <SectionTitle>Your salary, reimagined</SectionTitle>
            <SectionLead className="mt-6 max-w-lg">
              Spend smartly, send quickly, sort your salary automatically, and watch your savings
              grow — all with a Nevolute Inc. account.
            </SectionLead>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/signup">Open an account</Button>
              <Button variant="secondary" href="/savings">Move your salary</Button>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <img
              src={images.salary}
              alt=""
              className="mx-auto w-full max-w-[420px] rounded-[2rem] object-contain"
            />
          </Reveal>
        </div>
      </section>

      <section className="overflow-hidden bg-revolut-muted py-16 lg:py-20">
        <Reveal className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionTitle className="text-center text-[clamp(1.5rem,3vw,2rem)]">
            Join 80+ million customers worldwide and 13 million in the UK
          </SectionTitle>
        </Reveal>
        <div className="mt-10">
          <Marquee duration="50s">
            {trustBadges.map((badge) => (
              <BadgeCard key={badge.label} label={badge.label} />
            ))}
          </Marquee>
        </div>
      </section>

      <section id="savings" className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <Reveal>
            <SectionTitle>Life, meets savings</SectionTitle>
            <SectionLead className="mt-6 max-w-2xl">
              Grow your money with up to 4% AER (variable) interest on Instant Access Savings, paid
              every day.¹
            </SectionLead>
          </Reveal>

          <div className="mt-8 flex flex-wrap gap-2" role="tablist">
            {lifeTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={lifeTab === tab}
                onClick={() => setLifeTab(tab)}
                className={`tab-pill ${
                  lifeTab === tab
                    ? 'bg-revolut-ink text-white'
                    : 'bg-revolut-muted text-revolut-ink/70 hover:text-revolut-ink'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <Reveal>
              <AnimatePresence mode="wait">
                <motion.div
                  key={lifeTab}
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="flex min-h-[320px] items-end overflow-hidden rounded-[2rem] bg-[#101418] p-8 text-white"
                >
                  <div>
                    <p className="text-sm text-white/60">Instant Access Savings</p>
                    <p className="mt-2 text-5xl font-medium tracking-[-0.04em]">4.00%</p>
                    <p className="text-sm text-white/70">AER variable · {lifeTab} goal</p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="flex h-full flex-col justify-center rounded-3xl bg-revolut-muted p-8">
                <p className="text-revolut-ink/70">
                  Set aside money for what matters — whether it&apos;s a trip, a wedding, or a new
                  chapter. Rates vary by plan.
                </p>
                <Link to="/savings" className="mt-6 inline-block">
                  <Button variant="secondary">Explore Savings</Button>
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-revolut-ink py-20 text-white lg:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-2 lg:px-8">
          <Reveal>
            <SectionTitle className="!text-white">Elevate your spend</SectionTitle>
            <div className="mt-8 flex flex-wrap gap-2" role="tablist">
              {(['Physical cards', 'Virtual cards'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={cardTab === tab}
                  onClick={() => setCardTab(tab)}
                  className={`tab-pill ${
                    cardTab === tab ? 'bg-white text-revolut-ink' : 'bg-white/10 hover:bg-white/15'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={cardTab}
                className="mt-6 max-w-md type-body-lg text-white/75"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {cardTab === 'Physical cards'
                  ? 'Metal, Premium, and Ultra cards designed to stand out — with perks that match how you live.'
                  : 'Create virtual cards in seconds for safer online shopping and subscription control.'}
              </motion.p>
            </AnimatePresence>
            <Link to="/cards" className="mt-8 inline-block">
              <Button variant="secondary">Learn more</Button>
            </Link>
          </Reveal>
          <Reveal delay={0.1}>
            <AnimatePresence mode="wait">
              <motion.div
                key={cardTab}
                className="mx-auto w-full max-w-sm"
                initial={reduceMotion ? false : { opacity: 0, rotateY: -8 }}
                animate={{ opacity: 1, rotateY: 0 }}
                exit={{ opacity: 0, rotateY: 8 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <img
                  src={images.cards}
                  alt=""
                  className="w-full rounded-2xl object-cover shadow-2xl"
                />
              </motion.div>
            </AnimatePresence>
          </Reveal>
        </div>
      </section>

      <FeatureBlock
        title="Ask, and AIR makes it happen"
        body="AIR, from Nevolute Inc., is your 24/7 personal assistant. Just open your account, swipe, and ask away."
        cta="Try it out"
        href="/air"
        tone="light"
        image={images.salary}
      />

      <FeatureBlock
        title="Your money's safe space"
        body="With Nevolute Inc. Secure, you're entering the new era of money security — 24/7 protection through proactive defences and a team of specialists."
        cta="Learn more"
        href="/security"
        tone="muted"
        image={images.cards}
      />

      <FeatureBlock
        title="Explore 5,000+ stocks and ETFs"
        body="From Apple to Zoom, invest in some of the biggest companies in the world, commission-free within your monthly allowance.² Other fees may apply. Capital at risk."
        cta="Explore investing"
        href="/invest"
        tone="light"
        image={images.salary}
      />

      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <Reveal>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="type-label uppercase tracking-[0.12em] text-revolut-ink/50">Subscriptions</p>
                <SectionTitle className="mt-3">Plans that scale with you</SectionTitle>
              </div>
              <Link to="/plans" className="text-sm font-medium underline-offset-4 hover:underline">
                Compare all plans
              </Link>
            </div>
          </Reveal>
          <div className="mt-10">
            <PlansShowcase plans={personalPlans} />
          </div>
        </div>
      </section>

      <section className="py-20 text-center lg:py-24">
        <Reveal className="mx-auto max-w-2xl px-5">
          <SectionTitle>Join Nevolute Inc.</SectionTitle>
          <Button className="mt-8" href="/signup">Sign up</Button>
        </Reveal>
      </section>

      <Footer />
      <CookieBanner />
    </div>
  )
}

function FeatureBlock({
  title,
  body,
  cta,
  href,
  tone,
  image,
}: {
  title: string
  body: string
  cta: string
  href: string
  tone: 'light' | 'muted'
  image: string
}) {
  return (
    <section className={tone === 'muted' ? 'bg-revolut-muted py-20 lg:py-28' : 'py-20 lg:py-28'}>
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-2 lg:px-8">
        <Reveal className="order-2 lg:order-1">
          <img
            src={image}
            alt=""
            className="mx-auto w-full max-w-[380px] rounded-[2rem] object-contain"
          />
        </Reveal>
        <Reveal className="order-1 lg:order-2" delay={0.08}>
          <SectionTitle>{title}</SectionTitle>
          <SectionLead className="mt-6">{body}</SectionLead>
          <Link to={href} className="mt-8 inline-block">
            <Button variant="secondary">{cta}</Button>
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
