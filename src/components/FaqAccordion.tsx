"use client";

import { useState } from "react";

type FaqEntry = { q: string; a: string };

export function FaqAccordion({ items }: { items: FaqEntry[] }) {
  const [openIndexes, setOpenIndexes] = useState<Set<number>>(new Set());

  function toggle(i: number) {
    setOpenIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <>
      {items.map((item, i) => (
        <div
          className={`faq-item${openIndexes.has(i) ? " open" : ""}`}
          key={item.q}
          onClick={() => toggle(i)}
        >
          <div className="faq-q">
            <div className="faq-q-mark">Q</div>
            <div className="faq-q-text">{item.q}</div>
            <svg className="faq-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
          <div className="faq-a">
            <div className="faq-a-inner">{item.a}</div>
          </div>
        </div>
      ))}
    </>
  );
}
