/** Row for one developed film roll. */
export interface RollRowProps {
  slug: string;
  /** Display name of the stock, e.g. "Kodak ColorPlus 200" */
  stock: string;
  /** Colour negative = amber label, B&W = grey */
  stockType?: 'color' | 'bw';
  date: string;
  title: string;
  /** Place name, "+N" appended when the roll spans several: "Ha Noi +2" */
  location?: string;
  /** Highlighted because its map pin is hovered */
  active?: boolean;
  href?: string;
}
export function RollRow(props: RollRowProps): JSX.Element;
