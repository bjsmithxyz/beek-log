export interface BreadcrumbItem {
  /** Path segment: "~", "~/beek", "work", "mspaint.md" */
  label: string;
  href: string;
}
/**
 * Filesystem breadcrumb. Never sticky — it sits in a fixed 56px row in the page flow.
 */
export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  /** Wrap in the 56px .container row used by every page (default true) */
  row?: boolean;
}
export function Breadcrumb(props: BreadcrumbProps): JSX.Element;
