import React, { PropsWithChildren, ReactElement } from "react";
import { Insets, ViewProps, ViewStyle } from "react-native";

export interface ISpreadsheetIndexPath {
  column: number;
  row: number;
}
export interface ISpreadsheetPosition {
  x: number;
  y: number;
}
export interface ISpreadsheetSize {
  w: number;
  h: number;
}
export interface ISpreadsheetInnerSpace { left: number; top: number; right: number; bottom: number}
export interface ISpreadsheetRect
  extends ISpreadsheetPosition,
    ISpreadsheetSize {}
export interface ISpreadsheetIndexPathRange {
  tl: ISpreadsheetIndexPath;
  tr: ISpreadsheetIndexPath;
  bl: ISpreadsheetIndexPath;
  br: ISpreadsheetIndexPath;
}

export type SpreadsheetCellProps = PropsWithChildren<
  ViewProps & {
    indexPath: ISpreadsheetIndexPath;
  }
>;
export type SpreadsheetRowProps = PropsWithChildren<
  ViewProps & {
    row: number;
  }
>;

export type SpreadsheetCellComponentType =
  | React.FC<SpreadsheetCellProps>
  | React.ComponentClass<SpreadsheetCellProps>;

export type SpreadsheetRowComponentType =
  | React.FC<SpreadsheetRowProps>
  | React.ComponentClass<SpreadsheetRowProps>;

export type SpreadsheetScrollViewRef = {
  clearCaches: () => void
  clearCacheForRow: (row: number) => void
  scrollTo: (input: { x?: number; y?: number; animated?: boolean }) => void;
  visibleTo: (input: { x?: number; y?: number }) => void;
};

export type SpreadsheetSeparatorProps = {
  type: "top-corner" | "column-header" | "row-header";
};

export type SpreadsheetSeparatorComponentType =
  | React.FC<SpreadsheetSeparatorProps>
  | React.ComponentClass<SpreadsheetSeparatorProps>;

export type ISpreadsheetSizeForIndexCallback = (index: number) => number

export interface ISpreadsheetViewProps {
  style?: ViewStyle;

  frozenRows?: number;
  frozenColumns?: number;
  numColumns?: number;
  numRows?: number;
  renderItem: (data: {
    indexPath: ISpreadsheetIndexPath;
  }) => React.ReactElement;
  sizeForColumn?: number | ISpreadsheetSizeForIndexCallback;
  sizeForRow?: number | ISpreadsheetSizeForIndexCallback;
  preloadForRow?: number;
  preloadForColumn?: number;
  showsVerticalScrollIndicator?: boolean;
  showsHorizontalScrollIndicator?: boolean;

  scrollIndicatorInsets?: Insets;
  scrollsToTop?: boolean;

  CellComponent?: SpreadsheetCellComponentType;
  RowComponent?: SpreadsheetRowComponentType;
  SeparatorComponent?: SpreadsheetSeparatorComponentType;

  cornerContentStyle?: ViewStyle;
  cornerContentInsets?: Insets;
  columnHeaderStyle?: ViewStyle;
  columnHeaderInsets?: Insets;
  rowHeaderStyle?: ViewStyle;
  rowHeaderInsets?: Insets;

  separatorStyle?: ViewStyle;

  contentStyle?: ViewStyle;
  contentInsets?: Insets;

  rowStyle?: ViewStyle;
  cellStyle?: ViewStyle;
  cellSpace?: Partial<ISpreadsheetInnerSpace> | number;

  /**
   * @default false
   */
  renderExtraCells?: boolean
}
export interface ISpreadsheetViewRefProps {
  layout: () => void;
}

export type GetCellForIndexPathCallback = (
  indexPath: ISpreadsheetIndexPath
) => ReactElement;

export interface ISpreadsheetViewControlProps {
  CellComponent?: SpreadsheetCellComponentType;
  RowComponent?: SpreadsheetRowComponentType;
  SeparatorComponent?: SpreadsheetSeparatorComponentType;

  preloadForRow: number,
  preloadForColumn: number,
  contentSize: ISpreadsheetSize;
  numColumns: number;
  numRows: number;
  distanceForColumn: ISpreadsheetSizeForIndexCallback;
  distanceForRow: ISpreadsheetSizeForIndexCallback;
  rectForIndexPath: (indexPath: ISpreadsheetIndexPath) => ISpreadsheetRect;
  renderExtraCells?: boolean
  rowStyle?: ViewStyle;
  cellStyle?: ViewStyle;
  cellForIndexPath: GetCellForIndexPathCallback;
  sizeForRow: ISpreadsheetSizeForIndexCallback;
  sizeForColumn: ISpreadsheetSizeForIndexCallback;
  indexPathFromOffset: (offset: {
    x: number;
    y: number;
  }) => ISpreadsheetIndexPath;
}

export type SpreadsheetViewRef = {
  layout: () => void;
  resetScrollOffset:() => void;
  renderAllItems: () => void;
  renderItemAtIndexPath: (indexPath: ISpreadsheetIndexPath) => void;
  renderItemsAtIndexPaths: (indexPaths: ISpreadsheetIndexPath[]) => void;
  renderItemsAtRow: (row: number) => void;
  renderItemsAtRows: (row: number[]) => void;
  renderItemsAtColumn: (column: number) => void;
  renderItemsAtColumns: (column: number[]) => void;
  scrollTo: (input: { x?: number; y?: number; animated?: boolean }) => void;
  scrollToIndexPath: (
    indexPath: ISpreadsheetIndexPath,
    animated?: boolean
  ) => void;
  scrollToRow: (
    row: number,
    animated?: boolean
  ) => void;
};
