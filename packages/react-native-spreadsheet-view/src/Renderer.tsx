import { memo } from "react";
import { SpreadsheetRow } from "./Row";
import { SpreadsheetCell } from "./Cell";
import { getKeyForIndexPath } from "./utils";
import { ISpreadsheetIndexPath, ISpreadsheetPosition, ISpreadsheetViewControlProps } from "./types";

export const RowRenderer = memo(
  ({
    control,
    row,
    indexPaths,
    localOrigin,
  }: {
    control: ISpreadsheetViewControlProps;
    row: number;
    indexPaths: ISpreadsheetIndexPath[];
    localOrigin: ISpreadsheetPosition;
  }) => {
    const top = control.distanceForRow(row);
    const rowHeight = control.sizeForRow(row);

    const RowComponent = control.RowComponent ?? SpreadsheetRow;
    const CellComponent = control.CellComponent ?? SpreadsheetCell;
    
    return (
      <RowComponent
        
        row={row}
        style={[
          {
            position: "absolute",
            left: 0,
            top: top - localOrigin.y,
            width: "100%",
            height: rowHeight,
          },
          control.rowStyle,
        ]}
      >
        {indexPaths.map((indexPath) => {
          const itemRect = control.rectForIndexPath(indexPath);
          return (
            <CellComponent
              key={`${getKeyForIndexPath(indexPath)}:cell`}
              indexPath={indexPath}
              style={[
                {
                  position: "absolute",
                  top: 0,
                  left: itemRect.x - localOrigin.x,
                  width: itemRect.w,
                  height: itemRect.h,
                },
                control.cellStyle,
              ]}
            >
              {control.cellForIndexPath(indexPath)}
            </CellComponent>
          );
        })}
      </RowComponent>
    );
  }
);
