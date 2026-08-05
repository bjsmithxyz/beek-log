/**
 * Square terminal-style button or link.
 */
export interface ButtonProps {
  /** primary = accent outline that fills on hover; quiet = neutral outline that turns accent */
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
  size?: 'md' | 'sm';
  /** Renders an <a> instead of a <button> */
  href?: string;
  disabled?: boolean;
  onClick?: (event: React.MouseEvent) => void;
  children?: React.ReactNode;
  className?: string;
}
export function Button(props: ButtonProps): JSX.Element;
