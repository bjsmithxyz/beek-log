import React from 'react';
import { DirRow } from './DirRow.jsx';
import { Tag } from '../core/Tag.jsx';

/** A row in `photos/` — [film stock] · date · roll title · location · →. */
export function RollRow({ slug, stock, stockType = 'color', date, title, location, active = false, href }) {
  return (
    <DirRow
      id={`roll-${slug}`}
      cols="var(--roll-cols)"
      href={href || `/photos/${slug}/`}
      active={active}
      data-slug={slug}
      cells={[
        <Tag kind={stockType}>{stock}</Tag>,
        <span className="bjs-row__date">{date}</span>,
        <span className="bjs-row__name">{title}</span>,
        <span className="bjs-row__loc">{location}</span>,
      ]}
    />
  );
}
