/** Client-side listing filter. Labels are bracketed and lowercase. */
export interface FilterBarProps {
  /** Values shown after [all] — categories on work/, years on photos/ */
  options: string[];
  /** Currently selected value ("all" by default) */
  value?: string;
  onChange?: (value: string) => void;
  allLabel?: string;
}
export function FilterBar(props: FilterBarProps): JSX.Element;
