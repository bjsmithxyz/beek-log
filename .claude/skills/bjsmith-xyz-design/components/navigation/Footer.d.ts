export interface FooterLink { href: string; label: 'github' | 'instagram' | string }
/** Footer used on both surfaces. The theme toggle lives here — there is no header control. */
export interface FooterProps {
  /** Default: "// be excellent to each other." */
  tagline?: string;
  links?: FooterLink[];
  year?: number;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}
export function Footer(props: FooterProps): JSX.Element;
