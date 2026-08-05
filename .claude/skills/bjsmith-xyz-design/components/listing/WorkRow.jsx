import React from 'react';
import { DirRow } from './DirRow.jsx';
import { Tag } from '../core/Tag.jsx';

/** A row in `work/` — [category] · date · slug · description · →. */
export function WorkRow({ slug, category = 'dev', date, description, showDescription = true, href }) {
  const cells = [
    <Tag kind={category}>{category}</Tag>,
    <span className="bjs-row__date">{date}</span>,
    <span className="bjs-row__name">{slug}</span>,
  ];
  if (showDescription) cells.push(<span className="bjs-row__desc">{description}</span>);
  return <DirRow cols="var(--work-cols)" href={href || `/work/${slug}/`} cells={cells} data-category={category} />;
}
