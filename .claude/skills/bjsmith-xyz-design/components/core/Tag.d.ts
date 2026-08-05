/** Bracketed category label ([dev]) or bordered keyword chip. */
export interface TagProps {
  /** Colour role: work category, film type, or neutral */
  kind?: 'dev' | 'art' | 'photography' | 'color' | 'bw' | 'neutral';
  /** Wrap the label in square brackets (default true) */
  bracket?: boolean;
  /** Render as a bordered keyword chip instead (no brackets, muted) */
  chip?: boolean;
  children?: React.ReactNode;
}
export function Tag(props: TagProps): JSX.Element;
