import {
  PropsWithChildren,
  ReactElement,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ScrollView,
  ScrollViewProps,
  View,
  ViewStyle,
  StyleSheet,
} from "react-native";
import {
  ISpreadsheetIndexPath,
  ISpreadsheetRect,
  ISpreadsheetSize,
  ISpreadsheetViewControlProps,
  SpreadsheetCellComponentType,
  SpreadsheetScrollViewRef,
} from "./types";
import { getKeyForIndexPath } from "./utils";
import { SpreadsheetCell } from "./Cell";
import { SpreadsheetRow } from "./Row";

export const SpreadsheetScrollView = forwardRef<
  SpreadsheetScrollViewRef,
  ScrollViewProps & {
    offsetColumn?: number;
    offsetRow?: number;
    distanceColumn?: number;
    distanceRow?: number;
    numColumns?: number;
    numRows?: number;
    visibleWidth?: number;
    visibleHeight?: number;
    control: ISpreadsheetViewControlProps;
  }
>((props, ref) => {
  const {
    visibleHeight,
    visibleWidth,
    testID,
    offsetColumn = 0,
    offsetRow = 0,
    numColumns = 0,
    numRows = 0,
    distanceColumn = 0,
    distanceRow = 0,
    control,
    ...rest
  } = props;

  const [visibleOrigin, setVisibleOrigin] = useState({ x: 0, y: 0 });
  const [internalVisibleSize, setInternalVisibleSize] = useState({
    w: 0,
    h: 0,
  });
  const [layoutReady, setLayoutReady] = useState(false);
  const adjustedIndexPath = control.indexPathFromOffset(visibleOrigin);

  const localIndexPaths = useMemo(() => {
    const out = {
      tl: { row: 0, column: 0 },
      tr: { row: 0, column: 0 },
      bl: { row: 0, column: 0 },
      br: { row: 0, column: 0 },
    };

    out.tl.row = offsetRow + Math.max(0, adjustedIndexPath.row - 1);
    out.tr.row = out.tl.row;
    out.tl.column = offsetColumn + Math.max(0, adjustedIndexPath.column - 1);
    out.bl.column = out.tl.column;

    const _visibleH = visibleHeight ?? internalVisibleSize.h;
    const _visibleW = visibleWidth ?? internalVisibleSize.w;

    const tlRect = control.rectForIndexPath(out.tl);
    let lastX = tlRect.x - Math.max(0, visibleOrigin.x),
      lastY = tlRect.y - Math.max(0, visibleOrigin.y),
      estNumRows = 0,
      estNumCols = 0;
    do {
      const curCol = estNumCols + out.tl.column;
      if (curCol >= numColumns && numColumns > 0) {
        break;
      }
      estNumCols++;
      lastX += control.sizeForColumn(curCol);
    } while (lastX <= _visibleW + distanceColumn);
    do {
      const curRows = estNumRows + out.tl.row;
      if (curRows >= numRows && numRows > 0) {
        break;
      }
      estNumRows++;
      lastY += control.sizeForColumn(estNumRows + out.tl.row);
    } while (lastY <= _visibleH + distanceRow);

    out.bl.row = estNumRows + out.tl.row;
    out.br.row = estNumRows + out.tl.row;

    out.tr.column = estNumCols + out.tl.column + 1;
    out.br.column = estNumCols + out.tl.column + 1;

    return out;
  }, [
    offsetColumn,
    offsetRow,
    control.rectForIndexPath,
    control.sizeForColumn,
    control.sizeForColumn,
    internalVisibleSize,
    visibleHeight,
    visibleWidth,
    visibleOrigin,
  ]);

  const listOfIndexPaths = useMemo(() => {
    const rootIndexPaths: Array<{
      row: number;
      indexPaths: Array<ISpreadsheetIndexPath>;
    }> = [];
    for (
      let indexOfRow = localIndexPaths.tl.row;
      indexOfRow <= localIndexPaths.bl.row &&
      (!numRows || indexOfRow < numRows);
      indexOfRow++
    ) {
      const indexPaths: ISpreadsheetIndexPath[] = [];
      rootIndexPaths.push({ row: indexOfRow, indexPaths });
      for (
        let indexOfColumn = localIndexPaths.tl.column;
        indexOfColumn <= localIndexPaths.tr.column + 1 &&
        (!numColumns || indexOfColumn < numColumns);
        indexOfColumn++
      ) {
        indexPaths.push({ row: indexOfRow, column: indexOfColumn });
      }
    }
    return rootIndexPaths;
  }, [localIndexPaths]);

  const localOrigin = useMemo(() => {
    const rectForTL = control.rectForIndexPath({
      row: offsetRow,
      column: offsetColumn,
    });

    return {
      x: rectForTL.x,
      y: rectForTL.y,
    };
  }, [offsetColumn, offsetRow, localIndexPaths, control]);

  const internalRef = useRef<ScrollView>(null);
  useImperativeHandle(
    ref,
    () => {
      return {
        visibleTo: (input) => {
          const newPos = {
            x: input.x === undefined ? visibleOrigin.x : input.x,
            y: input.y === undefined ? visibleOrigin.y : input.y,
          };

          setVisibleOrigin(newPos);
        },
        scrollTo: (input) => {
          const newPos = {
            x: input.x === undefined ? visibleOrigin.x : input.x,
            y: input.y === undefined ? visibleOrigin.y : input.y,
          };
          internalRef.current?.scrollTo({
            x: newPos.x,
            y: newPos.y,
            animated: input.animated,
          });
          setVisibleOrigin(newPos);
        },
      };
    },
    [visibleOrigin]
  );

  const RowRenderer = control.RowComponent ?? SpreadsheetRow;
  const CellRenderer = control.CellComponent ?? SpreadsheetCell;

  return (
    <ScrollView
      testID={testID}
      ref={internalRef}
      scrollEnabled={false}
      directionalLockEnabled={false}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      alwaysBounceHorizontal={false}
      alwaysBounceVertical={false}
      onLayout={(evt) => {
        setInternalVisibleSize({
          w: evt.nativeEvent.layout.width,
          h: evt.nativeEvent.layout.height,
        });
        setLayoutReady(true);
      }}
      {...rest}
      contentContainerStyle={{
        width: control.contentSize.w - distanceColumn,
        height: control.contentSize.h - distanceRow,
      }}
    >
      {layoutReady && (
        <>
          {listOfIndexPaths.map(({ row, indexPaths = [] }) => {
            const top = control.distanceForRow(row);
            return (
              <RowRenderer
                key={`${row}-row`}
                row={row}
                style={{
                  position: "absolute",
                  top: top - localOrigin.y,
                  width: "100%",
                }}
              >
                {indexPaths.map((indexPath) => {
                  const itemRect = control.rectForIndexPath(indexPath);
                  return (
                    <CellRenderer
                      key={getKeyForIndexPath(indexPath)}
                      indexPath={indexPath}
                      style={[
                        control.cellStyle,
                        {
                          position: "absolute",
                          top: 0,
                          left: itemRect.x - localOrigin.x,
                          width: itemRect.w,
                          height: itemRect.h,
                        },
                      ]}
                    >
                      {control.cellForIndexPath(indexPath)}
                    </CellRenderer>
                  );
                })}
              </RowRenderer>
            );
          })}
        </>
      )}
    </ScrollView>
  );
});
