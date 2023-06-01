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
  scrollTo: (input: { x?: number; y?: number; animated?: boolean }) => void;
  visibleTo: (input: { x?: number; y?: number }) => void;
};

export type SpreadsheetSeparatorProps = {
  type: "top-corner" | "column-header" | "row-header";
};

export type SpreadsheetSeparatorComponentType =
  | React.FC<SpreadsheetSeparatorProps>
  | React.ComponentClass<SpreadsheetSeparatorProps>;

export interface ISpreadsheetViewProps {
  style?: ViewStyle;

  frozenRows?: number;
  frozenColumns?: number;
  numColumns?: number;
  numRows?: number;
  renderItem: (data: {
    indexPath: ISpreadsheetIndexPath;
  }) => React.ReactElement;
  sizeForColumn?: (columnIndex: number) => number | number;
  sizeForRow?: (rowIndex: number) => number | number;
  showsVerticalScrollIndicator?: boolean;
  showsHorizontalScrollIndicator?: boolean;
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

  scrollIndicatorInsets?: Insets;
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

  contentSize: ISpreadsheetSize;
  numColumns: number;
  numRows: number;
  distanceForColumn: (index: number) => number;
  distanceForRow: (index: number) => number;
  rectForIndexPath: (indexPath: ISpreadsheetIndexPath) => ISpreadsheetRect;

  rowStyle?: ViewStyle;
  cellStyle?: ViewStyle;
  cellForIndexPath: GetCellForIndexPathCallback;
  sizeForRow: (index: number) => number;
  sizeForColumn: (index: number) => number;
  indexPathFromOffset: (offset: {
    x: number;
    y: number;
  }) => ISpreadsheetIndexPath;
}

export type SpreadsheetViewRef = {
  layout: () => void;
  renderItemAtIndexPath: (indexPath: ISpreadsheetIndexPath) => void;
  renderItemAtIndexPaths: (indexPaths: ISpreadsheetIndexPath[]) => void;
  renderItemAtRow: (row: number) => void;
  renderItemAtColumn: (column: number) => void;
  scrollTo: (input: { x?: number; y?: number; animated?: boolean }) => void;
  scrollToIndexPath: (
    indexPath: ISpreadsheetIndexPath,
    animated?: boolean
  ) => void;
};
