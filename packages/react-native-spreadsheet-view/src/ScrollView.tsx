import {
  ReactElement,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { ScrollView, ScrollViewProps } from "react-native";
import { RowRenderer } from "./Renderer";
import {
  ISpreadsheetInnerSpace,
  ISpreadsheetViewControlProps,
  SpreadsheetScrollViewRef,
} from "./types";
import { getIndexPathRange, getRowBasedIndexPathList } from "./utils";

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
    cellSpace: ISpreadsheetInnerSpace;
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
    cellSpace,
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

  const { localOrigin, listOfIndexPaths } = useMemo(() => {
    const indexPathRange = getIndexPathRange({
      numColumns,
      numRows,
      offsetColumn,
      offsetRow,
      visibleOrigin,
      maxX,
      maxY,
      cellSpace,
      adjustedIndexPath,
      renderExtraCells: control.renderExtraCells,
      preloadForColumn: control.preloadForColumn,
      preloadForRow: control.preloadForRow,
      sizeForColumn: control.sizeForColumn,
      sizeForRow: control.sizeForRow,
      rectForIndexPath: control.rectForIndexPath,
    });
    const listOfIndexPaths = getRowBasedIndexPathList(
      indexPathRange,
      numRows,
      numColumns
    );

    const rectForTL = control.rectForIndexPath({
      row: offsetRow,
      column: offsetColumn,
    });

    const localOrigin = {
      x: rectForTL.x,
      y: rectForTL.y,
    };
    return { indexPathRange, localOrigin, listOfIndexPaths };
  }, [
    maxX,
    maxY,
    numRows,
    numColumns,
    offsetColumn,
    offsetRow,
    visibleOrigin,
    control.renderExtraCells,
    control.preloadForColumn,
    control.preloadForRow,
  ]);

  // console.log("[%s] maxX=%o,maxY=%o, indexPathRange=%o", testID,maxX, maxY, indexPathRange)

  const internalRef = useRef({
    rowCaches: {} as { [key: number]: ReactElement },
  });

  const scrollRef = useRef<ScrollView>(null);
  useImperativeHandle(
    ref,
    () => {
      return {
        clearCaches() {
          internalRef.current.rowCaches = {};
        },
        clearCacheForRow(row: number) {
          delete internalRef.current.rowCaches[row];
        },
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
          scrollRef.current?.scrollTo({
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

  const contentW = control.contentSize.w - distanceColumn;

  // console.log(
  //   "Rendering scrollView %s contentW=%o rows=%o cells=%o",
  //   testID,
  //   contentW,
  //   rowElms.length,
  //   rowElms.length * numColumns
  // );
  return (
    <ScrollView
      testID={testID}
      ref={scrollRef}
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
        width: contentW,
        height: control.contentSize.h - distanceRow,
      }}
    >
      {layoutReady && <>{listOfIndexPaths.map(({ row, indexPaths = [] }) => {
        const elm = (
          <RowRenderer
            key={`r${row}:row`}
            control={control}
            row={row}
            indexPaths={indexPaths}
            localOrigin={localOrigin}
          />
        );
        return elm;
      })}</>}
    </ScrollView>
  );
});
SpreadsheetScrollView.displayName = "SpreadsheetScrollView";
