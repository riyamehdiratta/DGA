import { useMemo, useState } from 'react';
import { TextInput } from '@/components/ui/FormField';
import { GAS_CARDS, GLOSSARY_TERMS } from '@/content/learn/glossary';
import type { GlossaryCategory } from '@/content/learn/glossary';

const CATEGORY_ORDER: GlossaryCategory[] = [
  'Fault codes',
  'Methods & engines',
  'Ratios & measures',
  'Status & severity',
];

/** Gas trading cards + a searchable list of every term the app throws around. */
export function GlossarySection() {
  const [query, setQuery] = useState('');

  const filteredTerms = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return GLOSSARY_TERMS;
    return GLOSSARY_TERMS.filter(
      (t) =>
        t.term.toLowerCase().includes(needle) ||
        (t.fullName?.toLowerCase().includes(needle) ?? false) ||
        t.definition.toLowerCase().includes(needle),
    );
  }, [query]);

  return (
    <div>
      {/* ——— The seven gases ——— */}
      <h2 className="anim-rise text-sm font-semibold uppercase tracking-wide text-gray-500">
        The seven gases
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {GAS_CARDS.map((gas, index) => (
          <div
            key={gas.formula}
            className="anim-rise group border border-gray-300 bg-white transition-shadow duration-200 hover:shadow-[0_3px_12px_rgba(28,39,51,0.12)]"
            style={{ animationDelay: `${index * 45}ms` }}
          >
            <div className="flex items-baseline justify-between border-b border-gray-200 px-4 py-2.5">
              <span className="font-mono text-lg font-bold text-gray-900">{gas.formula}</span>
              <span className="text-xs font-medium text-gray-500">{gas.name}</span>
            </div>
            <dl className="space-y-2 px-4 py-3">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Born from
                </dt>
                <dd className="mt-0.5 text-xs leading-relaxed text-gray-700">{gas.bornFrom}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Signals
                </dt>
                <dd className="mt-0.5 text-xs leading-relaxed text-gray-700">{gas.signals}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>

      {/* ——— Term glossary ——— */}
      <div className="mt-8 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Terminology
        </h2>
        <div className="w-full max-w-xs">
          <TextInput
            id="glossary-search"
            type="search"
            placeholder="Search terms… (e.g. D2, stray, ratio)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search glossary terms"
          />
        </div>
      </div>

      {filteredTerms.length === 0 ? (
        <p className="mt-4 border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          No terms match “{query}”.
        </p>
      ) : (
        CATEGORY_ORDER.map((category) => {
          const terms = filteredTerms.filter((t) => t.category === category);
          if (terms.length === 0) return null;
          return (
            <div key={category} className="mt-5">
              <h3 className="border-b border-gray-300 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-600">
                {category}
              </h3>
              <dl className="mt-2 grid gap-x-6 gap-y-3 md:grid-cols-2">
                {terms.map((term) => (
                  <div key={term.term} className="flex gap-3">
                    <dt className="w-24 shrink-0">
                      <span className="font-mono text-sm font-bold text-gray-900">{term.term}</span>
                      {term.fullName && (
                        <span className="mt-0.5 block text-[11px] leading-tight text-gray-500">
                          {term.fullName}
                        </span>
                      )}
                    </dt>
                    <dd className="text-xs leading-relaxed text-gray-700">{term.definition}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })
      )}
    </div>
  );
}
