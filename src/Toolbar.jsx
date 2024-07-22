import {
  DefaultToolbar,
  SelectToolbarItem,
  HandToolbarItem,
  DrawToolbarItem,
  EraserToolbarItem,
  ArrowToolbarItem,
  TextToolbarItem,
  NoteToolbarItem,
  AssetToolbarItem,
  RectangleToolbarItem,
  EllipseToolbarItem,
  TriangleToolbarItem,
  DiamondToolbarItem,
  HexagonToolbarItem,
  OvalToolbarItem,
  RhombusToolbarItem,
  StarToolbarItem,
  CloudToolbarItem,
  XBoxToolbarItem,
  CheckBoxToolbarItem,
  ArrowLeftToolbarItem,
  ArrowUpToolbarItem,
  ArrowDownToolbarItem,
  ArrowRightToolbarItem,
  LineToolbarItem,
  HighlightToolbarItem,
  LaserToolbarItem,
  FrameToolbarItem,
} from "tldraw";

const Toolbar = (props) => {
  return (
    <DefaultToolbar {...props}>
      <SelectToolbarItem />
      <HandToolbarItem />
      <EraserToolbarItem />
      <RectangleToolbarItem />
      <EllipseToolbarItem />
      <ArrowToolbarItem />
      <TextToolbarItem />
      <DrawToolbarItem />
      <AssetToolbarItem />
      <LineToolbarItem />
      <NoteToolbarItem />
      <TriangleToolbarItem />
      <DiamondToolbarItem />
      <HexagonToolbarItem />
      <OvalToolbarItem />
      <RhombusToolbarItem />
      <StarToolbarItem />
      <CloudToolbarItem />
      <XBoxToolbarItem />
      <CheckBoxToolbarItem />
      <ArrowLeftToolbarItem />
      <ArrowUpToolbarItem />
      <ArrowDownToolbarItem />
      <ArrowRightToolbarItem />
      <HighlightToolbarItem />
      <LaserToolbarItem />
      <FrameToolbarItem />
    </DefaultToolbar>
  );
};

export default Toolbar;
