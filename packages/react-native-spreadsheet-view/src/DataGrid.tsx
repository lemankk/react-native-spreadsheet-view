import { ForwardedRef, ReactElement, forwardRef, useCallback } from "react";
import { Text, ViewProps } from "react-native";
import {
  ISpreadsheetIndexPath,
  ISpreadsheetViewProps,
  SpreadsheetViewRef,
} from "./types"
import {
  SpreadsheetView,
} from "./SpreadsheetView"

export interface IDataGridColumnInfo {
  label: string;
  key?: string;
  width?: number;
}

export type DataGridHeaderRendererType<T = any> = (props: {
  column: IDataGridColumnInfo;
  indexPath: ISpreadsheetIndexPath;
}) => ReactElement;
export type DataGridBodyRendererType<T = any> = (props: {
  column: IDataGridColumnInfo;
  item: T;
  indexPath: ISpreadsheetIndexPath;
}) => ReactElement;

export interface IDataGridColumn<T = any> extends IDataGridColumnInfo {
  renderHeader?: DataGridHeaderRendererType<T>;
  renderCell?: DataGridBodyRendererType<T>;
}

export interface IDataGridBaseProps<T = any> {
  columns: IDataGridColumn<T>[];
  data: T[];
}

export const TextRenderer = ({ content }: { content: unknown }) => {
  return (
    <Text style={{ width: "100%" }} ellipsizeMode="tail" adjustsFontSizeToFit>
      {String(content)}
    </Text>
  );
};

export type DataGridProps<T = any> = ViewProps &
  Omit<
    ISpreadsheetViewProps,
    "renderItem" | "frozenRows" | "numRows" | "numColumns"
  > &
  IDataGridBaseProps<T>;

export const DataGrid = forwardRef(
  (props: DataGridProps<any>, ref: ForwardedRef<SpreadsheetViewRef>) => {
    const { columns, data = [], ...rest } = props;

    const sizeForColumn = (column: number) => columns[column]?.width ?? 100;
    const renderHeaderCell = useCallback(
      ({ indexPath }: { indexPath: ISpreadsheetIndexPath }) => {
        const field = columns[indexPath.column];
        if (field.renderHeader) {
          return field.renderHeader({ indexPath, column: field });
        }
        return TextRenderer({ content: field?.label });
      },
      [columns]
    );

    const renderBodyCell = useCallback(
      ({ indexPath }: { indexPath: ISpreadsheetIndexPath }) => {
        const field = columns[indexPath.column];
        const dataRow = data[indexPath.row - 1];
        if (field.renderCell) {
          return field.renderCell({ column: field, item: dataRow, indexPath });
        }
        return TextRenderer({ content: field?.key ? dataRow[field.key] : "" });
      },
      [columns, data]
    );

    const renderCell = useCallback(
      ({ indexPath }: { indexPath: ISpreadsheetIndexPath }) => {
        if (indexPath.row === 0) {
          return renderHeaderCell({ indexPath });
        }
        return renderBodyCell({ indexPath });
      },
      [renderHeaderCell, renderBodyCell]
    );
    return (
      <SpreadsheetView
        {...rest}
        ref={ref}
        frozenRows={1}
        numRows={data.length + 1}
        numColumns={columns.length}
        sizeForColumn={sizeForColumn}
        renderItem={renderCell}
      />
    );
  }
);

DataGrid.displayName = "DataGrid";
