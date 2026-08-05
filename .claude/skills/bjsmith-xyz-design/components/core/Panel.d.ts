/** Bordered, square-cornered panel with an optional hard offset shadow. */
export interface PanelProps {
  /** default = neutral border; accent/amber/blue borrow the semantic accents (admin review + publication states) */
  tone?: 'default' | 'accent' | 'amber' | 'blue';
  /** Neutral panels get the 3px grey hard shadow (default true) */
  shadow?: boolean;
  /** Small monospace path label above the title, e.g. "publication/review" */
  path?: string;
  title?: string;
  /** Right-aligned controls in the panel head */
  actions?: React.ReactNode;
  /** CSS padding override; defaults to var(--space-4) */
  padding?: string;
  children?: React.ReactNode;
}
export function Panel(props: PanelProps): JSX.Element;
