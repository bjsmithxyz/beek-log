export interface TreeNode {
  /** Directory names end in "/", files keep their extension */
  label: string;
  href?: string;
  /** Right-aligned muted note: "protected", "12 entries", "2025-08-24" */
  meta?: string;
  /** Present = branch; branches render a [+]/[-] disclosure */
  children?: TreeNode[];
  /** Start expanded (beek/ does; work/ and photos/ don't) */
  open?: boolean;
}
/**
 * ASCII site index — the homepage content itself, not a nav aside.
 */
export interface SiteTreeProps {
  /** Root label: "~" public, "~/admin" for the admin surface */
  root?: string;
  nodes: TreeNode[];
}
export function SiteTree(props: SiteTreeProps): JSX.Element;
