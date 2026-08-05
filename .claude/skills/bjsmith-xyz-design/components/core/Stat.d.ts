/** Single statistic cell: big tabular figure over an uppercase micro-caption. */
export interface StatProps {
  value: React.ReactNode;
  /** Uppercased automatically by CSS; write it lowercase */
  label: string;
}
export function Stat(props: StatProps): JSX.Element;

export interface StatGridProps {
  /** Cells per row; the travel page uses 3 (2 under 700px) */
  columns?: number;
  children?: React.ReactNode;
}
export function StatGrid(props: StatGridProps): JSX.Element;
