import {
  ISpreadsheetIndexPathRange,
  ISpreadsheetIndexPath,
  ISpreadsheetPosition,
  ISpreadsheetRect,
  ISpreadsheetSizeForIndexCallback,
  ISpreadsheetInnerSpace,
} from "./types";

export const getKeyForIndexPath = (indexPath: ISpreadsheetIndexPath) => {
  return `r${indexPath.row}c${indexPath.column}`;
};

export const getIndexPathList = (
  localIndexPaths: ISpreadsheetIndexPathRange,
  numRows?: number,
  numColumns?: number
) => {
  const rootIndexPaths: Array<{
    row: number;
    indexPaths: Array<ISpreadsheetIndexPath>;
  }> = [];
  for (
    let indexOfRow = localIndexPaths.tl.row;
    indexOfRow <= localIndexPaths.bl.row;
    indexOfRow++
  ) {
    const indexPaths: ISpreadsheetIndexPath[] = [];
    rootIndexPaths.push({ row: indexOfRow, indexPaths });
    for (
      let indexOfColumn = localIndexPaths.tl.column;
      indexOfColumn <= localIndexPaths.tr.column;
      indexOfColumn++
    ) {
      indexPaths.push({ row: indexOfRow, column: indexOfColumn });
    }
  }
  return rootIndexPaths;
};
export const getRowBasedIndexPathList = (
  localIndexPaths: ISpreadsheetIndexPathRange,
  numRows?: number,
  numColumns?: number
) => {
  const rootIndexPaths: Array<{
    row: number;
    indexPaths: Array<ISpreadsheetIndexPath>;
  }> = [];
  for (
    let indexOfRow = localIndexPaths.tl.row;
    indexOfRow <= localIndexPaths.bl.row;
    indexOfRow++
  ) {
    const indexPaths: ISpreadsheetIndexPath[] = [];
    rootIndexPaths.push({ row: indexOfRow, indexPaths });
    for (
      let indexOfColumn = localIndexPaths.tl.column;
      indexOfColumn <= localIndexPaths.tr.column;
      indexOfColumn++
    ) {
      indexPaths.push({ row: indexOfRow, column: indexOfColumn });
    }
  }
  return rootIndexPaths;
};

export const getIndexPathRange = ({
  numRows,
  offsetRow,
  adjustedIndexPath,
  numColumns,
  offsetColumn,
  visibleOrigin,
  preloadForColumn,
  preloadForRow,
  renderExtraCells,
  cellSpace,
  rectForIndexPath,
  sizeForColumn,
  sizeForRow,
  maxX,
  maxY,
}: {
  numRows: number;
  numColumns: number;
  offsetRow: number;
  offsetColumn: number;
  maxX: number;
  maxY: number;
  cellSpace: ISpreadsheetInnerSpace;
  preloadForRow: number;
  preloadForColumn: number;
  renderExtraCells?: boolean;
  adjustedIndexPath: ISpreadsheetIndexPath;
  visibleOrigin: ISpreadsheetPosition;
  rectForIndexPath: (indexPath: ISpreadsheetIndexPath) => ISpreadsheetRect;
  sizeForColumn: ISpreadsheetSizeForIndexCallback;
  sizeForRow: ISpreadsheetSizeForIndexCallback;
}) => {
  const out: ISpreadsheetIndexPathRange = {
    tl: { row: 0, column: 0 },
    tr: { row: 0, column: 0 },
    bl: { row: 0, column: 0 },
    br: { row: 0, column: 0 },
  };

  out.tl.row = offsetRow + Math.max(0, adjustedIndexPath.row - preloadForRow);
  out.tr.row = out.tl.row;
  out.tl.column = offsetColumn + Math.max(0, adjustedIndexPath.column - preloadForColumn);
  out.bl.column = out.tl.column;

  const tlRect = rectForIndexPath(out.tl);
  let lastX = tlRect.x - Math.max(0, visibleOrigin.x),
    lastY = tlRect.y - Math.max(0, visibleOrigin.y),
    estNumRows = -1,
    estNumCols = -1;

  do {
    estNumCols++;
    const curCol = estNumCols + out.tl.column;
    if (curCol >= numColumns && numColumns > 0) {
      break;
    }
    const size = sizeForColumn(curCol);
    lastX += size ;
    //   console.log('curCol=%o size=%o lastX=%o', curCol, size, lastX)
  } while (lastX <= maxX);
  do {
    estNumRows++;
    const curRows = estNumRows + out.tl.row;
    if (curRows >= numRows && numRows > 0) {
      break;
    }
    const size = sizeForRow(curRows);
    lastY += size ;
    // console.log('curRows=%o size=%o lastX=%o', curRows, size, lastY)
  } while (lastY <= maxY);

  let lastRows = estNumRows + out.tl.row + preloadForRow;
  let lastColumns = estNumCols + out.tl.column + preloadForColumn

  if (!renderExtraCells && lastRows > numRows + offsetRow && numRows > 0) {
    lastRows = numRows + offsetRow
  }
  if (!renderExtraCells && lastColumns > numColumns + offsetColumn && numColumns > 0) {
    lastColumns = numColumns + offsetColumn
  }

  out.bl.row = lastRows - 1;
  out.br.row = lastRows - 1;

  out.tr.column = lastColumns - 1;
  out.br.column = lastColumns - 1;

  return out;
};
