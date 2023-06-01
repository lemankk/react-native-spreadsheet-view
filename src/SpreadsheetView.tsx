import {
  PropsWithChildren,
  ReactElement,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  View,
  ViewProps,
} from "react-native";
import { SpreadsheetScrollView } from "./ScrollView";
import { styles } from "./styles";
import {
  ISpreadsheetIndexPath,
  ISpreadsheetRect,
  ISpreadsheetSize,
  ISpreadsheetViewControlProps,
  ISpreadsheetViewProps,
  SpreadsheetScrollViewRef,
  SpreadsheetViewRef,
} from "./types";
import { getKeyForIndexPath } from "./utils";

export const SpreadsheetView = forwardRef<
  SpreadsheetViewRef,
  PropsWithChildren<ISpreadsheetViewProps & ViewProps>
>((props, externalRef) => {
  const {
    frozenRows = 0,
    frozenColumns = 0,
    numColumns = 0,
    numRows = 0,
    renderItem,
    sizeForColumn,
    sizeForRow,
    scrollIndicatorInsets,
    scrollsToTop,

    style,
    rowHeaderInsets,
    rowHeaderStyle,

    columnHeaderInsets,
    columnHeaderStyle,

    cornerContentInsets,
    cornerContentStyle,

    contentInsets,
    contentStyle,

    separatorStyle,

    rowStyle,
    cellStyle,

    CellComponent,
    SeparatorComponent,

    ...restProps
  } = props;
  const _frozenRows = frozenRows > 0 ? frozenRows : 0;
  const _frozenColumns = frozenColumns > 0 ? frozenColumns : 0;
  const topCornerRef = useRef<SpreadsheetScrollViewRef>(null);
  const columnHeaderRef = useRef<SpreadsheetScrollViewRef>(null);
  const rowHeaderRef = useRef<SpreadsheetScrollViewRef>(null);
  const tableWrapperRef = useRef<ScrollView>(null);
  const tableRef = useRef<SpreadsheetScrollViewRef>(null);

  const [visibleSize, setVisibleSize] = useState({ w: 0, h: 0 });
  const [visibleBodySize, setVisibleBodySize] = useState({ w: 0, h: 0 });
  const [layoutReady, setLayoutReady] = useState(false);

  const [, triggerUpdate] = useState(0);

  const internalData = useRef({
    measuredColumn: 0,
    measuredRow: 0,

    frozenRowsY: 0,
    frozenColumnsX: 0,

    contentSize: { w: 0, h: 0 } as ISpreadsheetSize,
    visibleContentSize: { w: 0, h: 0 } as ISpreadsheetSize,
    sizeOfRows: {} as { [index: number]: number },
    sizeOfColumns: {} as { [index: number]: number },
    distanceOfRows: {} as { [index: number]: number },
    distanceOfColumns: {} as { [index: number]: number },
    cellsForIndexPathes: {} as Record<string, ReactElement>,
    visibleColumns: [] as number[],
  });

  const getSizeForRow = useCallback(
    (index: number) => {
      let size = internalData.current.sizeOfRows[index];
      if (size === undefined) {
        size = 1;
        if (typeof sizeForRow === "function") {
          size = sizeForRow(index);
        }
        if (typeof sizeForRow === "number") {
          size = sizeForRow;
        }
        internalData.current.sizeOfRows[index] = size;
      }
      return size;
    },
    [sizeForRow]
  );

  const getSizeForColumn = useCallback(
    (index: number) => {
      let size = internalData.current.sizeOfColumns[index];
      if (size === undefined) {
        size = 1;
        if (typeof sizeForColumn === "function") {
          size = sizeForColumn(index);
        }
        if (typeof sizeForColumn === "number") {
          size = sizeForColumn;
        }
        internalData.current.sizeOfColumns[index] = size;
      }
      return size;
    },
    [sizeForColumn]
  );

  const measureLayout = useCallback(() => {
    const state = internalData.current;

    state.contentSize.w = 0;
    state.contentSize.h = 0;
    state.visibleContentSize.w = 0;
    state.visibleContentSize.h = 0;

    let lastX = 0,
      lastY = 0,
      estNumRows = 0,
      estNumCols = 0;
    do {
      estNumCols++;
      lastX += getSizeForColumn(estNumCols);
    } while (lastX <= visibleSize.w);
    do {
      estNumRows++;
      lastY += getSizeForRow(estNumRows);
    } while (lastY <= visibleSize.h);

    state.measuredRow = Math.max(numRows, estNumRows);
    state.measuredColumn = Math.max(numColumns, estNumCols);

    // Getting all size from the grid first
    for (let index = 0; index <= state.measuredRow; index++) {
      const size = getSizeForRow(index);
      state.visibleContentSize.h += size;

      const distance = (state.distanceOfRows[index] =
        index < 1
          ? 0
          : state.distanceOfRows[index - 1] + state.sizeOfRows[index - 1]);
    }
    for (let index = 0; index <= state.measuredColumn; index++) {
      const size = getSizeForColumn(index);
      state.visibleContentSize.w += size;

      const distance = (state.distanceOfColumns[index] =
        index < 1
          ? 0
          : state.distanceOfColumns[index - 1] +
            state.sizeOfColumns[index - 1]);
    }

    state.frozenRowsY = 0;
    for (let index = 0; index < _frozenRows; index++) {
      state.frozenRowsY += getSizeForRow(index);
    }
    state.frozenColumnsX = 0;
    for (let index = 0; index < _frozenColumns; index++) {
      state.frozenColumnsX += getSizeForColumn(index);
    }

    const contentRect = getRectForIndexPath({
      column: numColumns,
      row: numRows,
    });
    state.contentSize.w = contentRect.w + contentRect.x;
    state.contentSize.h = contentRect.h + contentRect.y;

    triggerUpdate(Date.now());
  }, [
    numColumns,
    numRows,
    _frozenColumns,
    _frozenRows,
    getSizeForColumn,
    getSizeForRow,
    visibleSize,
  ]);

  const getIndexPathFromOffset = useCallback(
    (input: { x: number; y: number }): ISpreadsheetIndexPath => {
      const state = internalData.current;

      let column = 0,
        row = 0;
      for (let index = 0; index < numColumns; index++) {
        if (state.distanceOfColumns[index] >= input.x) {
          break;
        } else {
          column = index;
        }
      }

      for (let index = 0; index < numRows; index++) {
        if (state.distanceOfRows[index] >= input.y) {
          break;
        } else {
          row = index;
        }
      }

      return { column, row };
    },
    [numColumns, numRows]
  );

  const getCellForIndexPath = useCallback(
    (indexPath: ISpreadsheetIndexPath) => {
      const state = internalData.current;

      const key = getKeyForIndexPath(indexPath);
      let elm = state.cellsForIndexPathes[key];
      if (!elm) {
        state.cellsForIndexPathes[key] = elm = renderItem({ indexPath });
      }

      return elm;
    },
    [renderItem]
  );

  const getRectForIndexPath = useCallback(
    (indexPath: ISpreadsheetIndexPath): ISpreadsheetRect => {
      const state = internalData.current;
      const y = state.distanceOfRows[indexPath.row] ?? 0;
      const x = state.distanceOfColumns[indexPath.column] ?? 0;
      const h = state.sizeOfRows[indexPath.row] ?? 0;
      const w = state.sizeOfColumns[indexPath.column] ?? 0;

      const rect: ISpreadsheetRect = { x, y, w, h };
      return rect;
    },
    []
  );

  const getDistanceForRow = useCallback((index: number): number => {
    const state = internalData.current;
    const val = state.distanceOfRows[index] ?? 0;
    return val;
  }, []);

  const getDistanceForColumn = useCallback((index: number): number => {
    const state = internalData.current;
    const val = state.distanceOfColumns[index] ?? 0;
    return val;
  }, []);

  const resetLayout = useCallback(() => {
    columnHeaderRef.current?.scrollTo({
      x: 0,
      y: 0,
      animated: false,
    });
    rowHeaderRef.current?.scrollTo({
      x: 0,
      y: 0,
      animated: false,
    });
    tableWrapperRef.current?.scrollTo({
      x: 0,
      y: 0,
      animated: false,
    });
    tableRef.current?.scrollTo({
      x: 0,
      y: 0,
      animated: false,
    });
  }, []);
  const updateLayout = useCallback(() => {}, []);
  const scrollTo = useCallback(
    (input: { x?: number; y?: number; animated?: boolean }) => {
      columnHeaderRef.current?.scrollTo({
        x: input.x,
        animated: false,
      });
      rowHeaderRef.current?.scrollTo({
        y: input.y,
        animated: input.animated,
      });
      tableWrapperRef.current?.scrollTo({
        x: input.x,
        animated: input.animated,
      });
      tableRef.current?.scrollTo({
        y: input.y,
        animated: input.animated,
      });
    },
    []
  );

  const onBodyVerticalScroll = useCallback(
    (evt: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset } = evt.nativeEvent;

      rowHeaderRef.current?.scrollTo({
        y: contentOffset.y,
        animated: false,
      });
      tableRef.current?.visibleTo({
        y: contentOffset.y,
      });
    },
    []
  );
  const onBodyHorizontalScroll = useCallback(
    (evt: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset } = evt.nativeEvent;

      columnHeaderRef.current?.scrollTo({
        x: contentOffset.x,
        animated: false,
      });

      tableRef.current?.visibleTo({
        x: contentOffset.x,
      });
    },
    []
  );
  const renderItemAtIndexPath = useCallback(
    (indexPath: ISpreadsheetIndexPath) => {
      const key = getKeyForIndexPath(indexPath);
      internalData.current.cellsForIndexPathes[key] = renderItem({
        indexPath,
      });

      triggerUpdate(Date.now());
    },
    []
  );
  const renderItemAtIndexPaths = useCallback(
    (indexPaths: ISpreadsheetIndexPath[]) => {
      for (const indexPath of indexPaths) {
        const key = getKeyForIndexPath(indexPath);
        internalData.current.cellsForIndexPathes[key] = renderItem({
          indexPath,
        });
      }

      triggerUpdate(Date.now());
    },
    []
  );

  useImperativeHandle(
    externalRef,
    () => {
      return {
        layout: () => {
          measureLayout();
          updateLayout();
        },
        renderItemAtIndexPath: renderItemAtIndexPath,
        renderItemAtIndexPaths: renderItemAtIndexPaths,
        renderItemAtColumn: (column: number) => {
          const indexPaths: ISpreadsheetIndexPath[] = [];
          for (let index = 0; index < numRows; index++) {
            indexPaths.push({ row: index, column });
          }

          return renderItemAtIndexPaths(indexPaths);
        },
        renderItemAtRow: (row: number) => {
          const indexPaths: ISpreadsheetIndexPath[] = [];
          for (let index = 0; index < numColumns; index++) {
            indexPaths.push({ row, column: index });
          }

          return renderItemAtIndexPaths(indexPaths);
        },
        scrollTo: scrollTo,
        scrollToIndexPath: (indexPath, animated?: boolean) => {
          const rect = getRectForIndexPath(indexPath);
          scrollTo({ x: rect.x, y: rect.y, animated });
        },
      };
    },
    [
      measureLayout,
      updateLayout,
      renderItemAtIndexPath,
      renderItemAtIndexPaths,
      numColumns,
      numRows,
    ]
  );

  const control: ISpreadsheetViewControlProps = {
    CellComponent: props.CellComponent,
    RowComponent: props.RowComponent,
    numColumns,
    numRows,
    rowStyle,
    cellStyle,
    contentSize: internalData.current.contentSize,
    rectForIndexPath: getRectForIndexPath,
    cellForIndexPath: getCellForIndexPath,
    distanceForColumn: getDistanceForColumn,
    distanceForRow: getDistanceForRow,
    sizeForColumn: getSizeForColumn,
    sizeForRow: getSizeForRow,
    indexPathFromOffset: getIndexPathFromOffset,
  };

  useEffect(() => {
    if (!layoutReady) return;
    internalData.current.sizeOfColumns = {};
    internalData.current.distanceOfColumns = {};
    measureLayout();
    resetLayout();
  }, [sizeForColumn]);

  useEffect(() => {
    if (!layoutReady) return;
    internalData.current.sizeOfRows = {};
    internalData.current.distanceOfRows = {};
    measureLayout();
    resetLayout();
  }, [sizeForRow]);

  useEffect(() => {


    measureLayout();
  }, []);

  return (
    <View
      style={[styles.rootView, style]}
      onLayout={(evt) => {
        setVisibleSize({
          w: evt.nativeEvent.layout.width,
          h: evt.nativeEvent.layout.height,
        });
        setLayoutReady(true);
      }}
      {...restProps}
    >
      {layoutReady && _frozenRows > 0 && (
        <>
          <View
            style={[
              styles.listHeader,
              { height: internalData.current.frozenRowsY },
            ]}
          >
            {frozenColumns > 0 && (
              <>
                <SpreadsheetScrollView
                  testID="topCorner"
                  control={control}
                  style={[
                    styles.topCorner,
                    cornerContentStyle,
                    { width: internalData.current.frozenColumnsX },
                  ]}
                  ref={topCornerRef}
                  numRows={_frozenRows}
                  numColumns={_frozenColumns}
                  scrollEnabled={false}
                  contentInset={cornerContentInsets}
                  showsHorizontalScrollIndicator={false}
                  showsVerticalScrollIndicator={false}
                />
                {SeparatorComponent ? (
                  <SeparatorComponent type="top-corner" />
                ) : (
                  <View
                    style={[styles.separator, separatorStyle, styles.h100]}
                  />
                )}
              </>
            )}
            <SpreadsheetScrollView
              testID="columnHeader"
              control={control}
              style={[
                styles.columnHeader,
                columnHeaderStyle,
                { width: visibleSize.w - internalData.current.frozenColumnsX },
              ]}
              ref={columnHeaderRef}
              scrollEnabled={false}
              horizontal
              offsetColumn={_frozenColumns}
              distanceColumn={getDistanceForColumn(_frozenColumns)}
              numRows={_frozenRows}
              contentInset={columnHeaderInsets}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
            />
          </View>
          {SeparatorComponent ? (
            <SeparatorComponent type="column-header" />
          ) : (
            <View style={[styles.separator, separatorStyle, styles.w100]} />
          )}
        </>
      )}
      {layoutReady && (
        <View
          style={styles.listBody}
          onLayout={(evt) => {
            setVisibleBodySize({
              w: evt.nativeEvent.layout.width,
              h: evt.nativeEvent.layout.height,
            });
          }}
        >
          {frozenColumns > 0 && (
            <>
              <SpreadsheetScrollView
                testID="rowHeader"
                control={control}
                style={[
                  styles.rowHeader,
                  rowHeaderStyle,
                  { width: internalData.current.frozenColumnsX },
                ]}
                ref={rowHeaderRef}
                scrollEnabled={false}
                offsetRow={_frozenRows}
                distanceRow={getDistanceForRow(_frozenRows)}
                numColumns={frozenColumns}
                contentInset={rowHeaderInsets}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
              />
              {SeparatorComponent ? (
                <SeparatorComponent type="row-header" />
              ) : (
                <View style={[styles.separator, separatorStyle, styles.h100]} />
              )}
            </>
          )}
          <ScrollView
            horizontal={false}
            onMomentumScrollEnd={onBodyVerticalScroll}
            onScroll={onBodyVerticalScroll}
            scrollEventThrottle={24}
            ref={tableWrapperRef}
            bounces={false}
            alwaysBounceHorizontal={false}
            alwaysBounceVertical={false}
            style={[
              styles.rowBody,
              contentStyle,
              { width: visibleSize.w - internalData.current.frozenColumnsX },
            ]}
          >
            <SpreadsheetScrollView
              testID="tableBody"
              control={control}
              horizontal={true}
              ref={tableRef}
              visibleWidth={visibleBodySize.w}
              visibleHeight={visibleBodySize.h}
              offsetRow={_frozenRows}
              distanceRow={getDistanceForRow(_frozenRows)}
              offsetColumn={_frozenColumns}
              distanceColumn={getDistanceForColumn(_frozenColumns)}
              scrollEnabled={true}
              onMomentumScrollEnd={onBodyHorizontalScroll}
              onScroll={onBodyHorizontalScroll}
              scrollEventThrottle={24}
              scrollsToTop={scrollsToTop}
              contentInset={contentInsets}
              scrollIndicatorInsets={scrollIndicatorInsets}
              showsHorizontalScrollIndicator={true}
              showsVerticalScrollIndicator={true}
            />
          </ScrollView>
        </View>
      )}
    </View>
  );
});
