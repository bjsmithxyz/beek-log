export interface LightboxItem {
  src: string;
  /** Larger source shown in the overlay */
  full?: string;
  alt?: string;
  caption?: string;
  /** Letterspaced metadata line: "FUJIFILM 400 · 12A · 08 25 · ALMATY" */
  meta?: string;
}
/** Full-screen image viewer with keyboard + arrow navigation. */
export interface LightboxProps {
  open?: boolean;
  items: LightboxItem[];
  index?: number;
  onClose?: () => void;
  /** direction is -1 or +1; wrap around at the ends */
  onNavigate?: (direction: number) => void;
}
export function Lightbox(props: LightboxProps): JSX.Element;
