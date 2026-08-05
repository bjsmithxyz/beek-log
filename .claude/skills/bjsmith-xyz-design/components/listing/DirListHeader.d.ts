/**
 * Column header row for a directory listing. Hidden below 768px.
 */
export interface DirListHeaderProps {
  /** Lowercase labels; CSS uppercases them */
  columns: string[];
  /** grid-template-columns — must match the rows below (var(--work-cols) / var(--roll-cols)) */
  cols: string;
}
export function DirListHeader(props: DirListHeaderProps): JSX.Element;
