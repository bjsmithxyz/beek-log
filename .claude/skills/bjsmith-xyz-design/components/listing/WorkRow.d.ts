/** Row for a work entry (dev / art / photography). */
export interface WorkRowProps {
  /** Filename slug — displayed verbatim, not the title */
  slug: string;
  category?: 'dev' | 'art' | 'photography';
  /** Pre-formatted list date, e.g. "2019-01-31" */
  date: string;
  description?: string;
  showDescription?: boolean;
  href?: string;
}
export function WorkRow(props: WorkRowProps): JSX.Element;
