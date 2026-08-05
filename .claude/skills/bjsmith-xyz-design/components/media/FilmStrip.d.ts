export interface FilmFrame { src: string; alt?: string; caption?: string }
/**
 * A physical film strip: near-black base in both themes, punched sprocket holes,
 * edge print in the stock colour, six frames per strip.
 */
export interface FilmStripProps {
  /** Up to 6 frames per strip; slice longer rolls into several strips */
  photos: FilmFrame[];
  /** Display name printed on the film edge (uppercased) */
  stockName: string;
  /** Colour negative edge print is amber; B&W rebate text is grey */
  stockType?: 'color' | 'bw';
  /** 1-based frame number of the first frame in this strip */
  startFrame?: number;
  /** Frame click handler — wire to Lightbox */
  onSelect?: (index: number) => void;
}
export function FilmStrip(props: FilmStripProps): JSX.Element;
