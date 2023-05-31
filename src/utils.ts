import { ISpreadsheetIndexPath } from "./types";


export const getKeyForIndexPath = (indexPath: ISpreadsheetIndexPath) => {
    return `r${indexPath.row}c${indexPath.column}`;
  };
  