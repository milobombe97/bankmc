import { useRef } from 'react'
import { Link } from 'react-router-dom'

export type Plan = {
  name: string
  price: string
  description: string
  href?: string
}

export function PlansCarousel({ plans }: { plans: Plan[] }) {
  const scroller = useRef<HTMLDivElement>(null)
  const items = plans

  return (
    <div
      ref={scroller}
      className="plans-scroll -mx-5 flex gap-4 overflow-x-auto px-5 pb-2 lg:-mx-8 lg:px-8"
    >
      {items.map((plan, index) => (
        <article
          key={`${plan.name}-${index}`}
          className="plan-card min-w-[min(85vw,280px)] flex-shrink-0 rounded-3xl border border-revolut-line bg-white p-6 shadow-[0_1px_3px_rgba(25,28,31,0.06)] transition-shadow duration-300 hover:shadow-md"
        >
          <h3 className="type-h3 text-xl">{plan.name}</h3>
          <p className="mt-2 text-2xl font-medium tracking-[-0.03em]">{plan.price}</p>
          <p className="mt-4 text-sm leading-relaxed text-revolut-ink/65">{plan.description}</p>
          <Link
            to={plan.href ?? '/plans'}
            className="mt-6 inline-block text-sm font-medium underline-offset-4 hover:underline"
          >
            Learn more
          </Link>
        </article>
      ))}
    </div>
  )
}
