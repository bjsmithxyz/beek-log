export interface MapPin {
  /** Primary region name, usually a country */
  label: string;
  lat: number;
  lng: number;
  /** Frame count summed across member rolls */
  count: number;
  /** City names listed in the tooltip */
  members?: string[];
  /** Roll slug the pin links to */
  slug: string;
  /** Every roll slug this pin represents (for cross-highlighting) */
  slugs?: string[];
}
/** Dot-matrix world map in the terminal aesthetic — no tiles, no colour imagery. */
export interface WorldMapProps {
  /** Land mask: one string of '0'/'1' per grid row (assets/world-dots.json) */
  dots: string[];
  pins: MapPin[];
  /** Roll slug currently hovered in the listing below */
  activeSlug?: string;
  onPinHover?: (pin: MapPin | null) => void;
}
export function WorldMap(props: WorldMapProps): JSX.Element;
