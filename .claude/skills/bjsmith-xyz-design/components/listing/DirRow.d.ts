/** One row of a file listing: 1px border, -1px top margin so rows share hairlines. */
export interface DirRowProps {
  /** grid-template-columns for this row (include a 1.5rem trailing column for the arrow) */
  cols: string;
  href?: string;
  /** Simple cell contents, left to right */
  cells?: Array<React.ReactNode | { content: React.ReactNode; className?: string }>;
  /** Trailing glyph; pass null to omit */
  arrow?: string | null;
  /** Accent border + outline (map-pin cross-highlight state) */
  active?: boolean;
  children?: React.ReactNode;
  id?: string;
}
export function DirRow(props: DirRowProps): JSX.Element;
