import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { ScrollView, ScrollViewProps } from "react-native";
import {
  ISpreadsheetViewControlProps,
  SpreadsheetScrollViewRef,
} from "./types";
import {
  getIndexPathRange,
  getKeyForIndexPath,
  getRowBasedIndexPathList,
} from "./utils";
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

  const _visibleH = visibleHeight ?? internalVisibleSize.h;
  const _visibleW = visibleWidth ?? internalVisibleSize.w;
  const maxX = _visibleW + distanceColumn;
  const maxY = _visibleH + distanceRow;

  const localIndexPaths = useMemo(() => {
    const out = getIndexPathRange({
      numColumns,
      numRows,
      offsetColumn,
      offsetRow,
      visibleOrigin,
      maxX,
      maxY,
      adjustedIndexPath,
      sizeForColumn: control.sizeForColumn,
      sizeForRow: control.sizeForRow,
      rectForIndexPath: control.rectForIndexPath,
    });
    return out;
  }, [
    maxX,
    maxY,
    numRows,
    numColumns,
    offsetColumn,
    offsetRow,
    control.rectForIndexPath,
    control.sizeForColumn,
    control.sizeForRow,
    visibleOrigin,
  ]);

  //   console.log("[%s] maxX=%o,maxY=%o, indexPathRange=%o", testID,maxX, maxY, localIndexPaths)

  const listOfIndexPaths = useMemo(() => {
    return getRowBasedIndexPathList(localIndexPaths, numRows, numColumns);
  }, [localIndexPaths, numRows, numColumns]);

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
                style={[
                  {
                    position: "absolute",
                    top: top - localOrigin.y,
                    width: "100%",
                  },
                  control.rowStyle,
                ]}
              >
                {indexPaths.map((indexPath) => {
                  const itemRect = control.rectForIndexPath(indexPath);
                  return (
                    <CellRenderer
                      key={getKeyForIndexPath(indexPath)}
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
