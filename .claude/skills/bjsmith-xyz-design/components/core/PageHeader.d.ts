/** Page title block. Titles are filesystem paths: `work/`, `about.md`, `new-roll/`. */
export interface PageHeaderProps {
  /** Lowercase path-style title, trailing slash for directories */
  title: string;
  /** One muted line, often a count: "24 entries — projects, art, photography" */
  description?: string;
  /** Right-aligned buttons (admin screens) */
  actions?: React.ReactNode;
}
export function PageHeader(props: PageHeaderProps): JSX.Element;
