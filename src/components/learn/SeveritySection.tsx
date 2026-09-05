import { StatusBadge } from '@/components/ui/StatCard';
import {
  EXPERT_JUDGMENT_CAVEAT,
  SEVERITY_TIERS,
  STATUS_MEANINGS,
} from '@/content/learn/severityTiers';

/**
 * The DGA Status trio and the five-tier severity ladder — what the numbers
 * at the top of every analysis actually mean, and what to do about them.
 */
export function SeveritySection() {
  return (
    <div className="mx-auto max-w-3xl">
      {/* ——— Status ——— */}
      <h2 className="anim-rise text-sm font-semibold uppercase tracking-wide text-gray-500">
        First, the DGA Status
      </h2>
      <p className="anim-rise mt-1 text-sm leading-relaxed text-gray-600">
        Every analysis starts by classifying the transformer's overall gassing condition
        against the IEEE threshold tables. This is the anchor for everything that follows.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {STATUS_MEANINGS.map((info, index) => (
          <div
            key={info.status}
            className="anim-rise border border-gray-300 bg-white px-4 py-3"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <StatusBadge status={info.status} />
            <p className="mt-2 text-sm font-semibold text-gray-900">{info.meaning}</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-600">{info.rule}</p>
          </div>
        ))}
      </div>

      {/* ——— Severity ladder ——— */}
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Then, the severity ladder
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-gray-600">
        The Recommendation engine combines the Status with the diagnosed fault zones into one
        of five tiers. Each tier carries the exact action set from IEEE C57.104-2019 — nothing
        added, nothing removed.
      </p>

      <ol className="mt-4 space-y-2">
        {SEVERITY_TIERS.map((tier, index) => (
          <li
            key={tier.tier}
            className={`anim-rise border-l-4 bg-white ${tier.accentClasses} border border-gray-300`}
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <div className="px-4 py-3">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className={`inline-block border px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${tier.accentClasses}`}>
                  {index + 1} · {tier.label}
                </span>
                <span className="text-xs text-gray-500">{tier.trigger}</span>
              </div>
              <ul className="mt-2 list-disc space-y-0.5 pl-5">
                {tier.actions.map((action) => (
                  <li key={action} className="text-xs leading-relaxed text-gray-700">
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>

      {/* ——— Mandatory caveat ——— */}
      <blockquote className="anim-rise mt-6 border-l-4 border-gray-800 bg-gray-50 px-4 py-3">
        <p className="text-xs italic leading-relaxed text-gray-700">“{EXPERT_JUDGMENT_CAVEAT}”</p>
        <footer className="mt-1.5 text-[11px] font-medium uppercase tracking-wide text-gray-500">
          IEEE Std C57.104-2019, Clause 5.3 — attached to every recommendation this system produces
        </footer>
      </blockquote>
    </div>
  );
}
