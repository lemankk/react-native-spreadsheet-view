import {
  PropsWithChildren,
  ReactElement,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
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
  ISpreadsheetInnerSpace,
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
    cellSpace,

    CellComponent,
    SeparatorComponent,

    preloadForRow = 1,
    preloadForColumn = 1,

    renderExtraCells = false,

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
        size = 100;
        if (typeof sizeForRow === "number") {
          size = sizeForRow;
        } else if (typeof sizeForRow === "function") {
          size = sizeForRow(index);
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
        size = 100;
        if (typeof sizeForColumn === "number") {
          size = sizeForColumn;
        } else if (typeof sizeForColumn === "function") {
          size = sizeForColumn(index);
        }
        internalData.current.sizeOfColumns[index] = size;
      }
      return size;
    },
    [sizeForColumn]
  );

  const updater = useCallback(() => {
    // console.log("> updater()")
    triggerUpdate(Date.now())
  }, []);

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

    const minRows = Math.max(numRows, estNumRows) + preloadForRow;
    const minColumns = Math.max(numColumns, estNumCols) + preloadForColumn;

    if (state.measuredRow < minRows) {
      state.measuredRow = minRows;
    }
    if (state.measuredColumn < minColumns) {
      state.measuredColumn = minColumns;
    }

    // Getting all size from the grid first
    for (let index = 0; index <= state.measuredRow; index++) {
      const size = getSizeForRow(index);
      state.visibleContentSize.h += size;

      state.distanceOfRows[index] =
        index < 1
          ? 0
          : state.distanceOfRows[index - 1] + state.sizeOfRows[index - 1];
    }
    for (let index = 0; index <= state.measuredColumn; index++) {
      const size = getSizeForColumn(index);
      state.visibleContentSize.w += size;

      state.distanceOfColumns[index] =
        index < 1
          ? 0
          : state.distanceOfColumns[index - 1] + state.sizeOfColumns[index - 1];
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
      column: numColumns - 1,
      row: numRows - 1,
    });
    state.contentSize.w = contentRect.w + contentRect.x;
    state.contentSize.h = contentRect.h + contentRect.y;
  }, [
    numColumns,
    numRows,
    _frozenColumns,
    _frozenRows,
    getSizeForColumn,
    getSizeForRow,
    visibleSize,
    preloadForColumn,
    preloadForRow,
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
    (indexPath: ISpreadsheetIndexPath, forceRender = false) => {
      const state = internalData.current;

      const key = getKeyForIndexPath(indexPath);
      let elm = state.cellsForIndexPathes[key];
      if (!elm || forceRender) {
        // console.log("Rendering cell atIndexPath %s", key);
        state.cellsForIndexPathes[key] = elm = renderItem({ indexPath });
      }

      return elm;
    },
    [renderItem]
  );

  const clearCellCacheForIndexPaths = useCallback(
    (indexPaths: ISpreadsheetIndexPath[]) => {
      const state = internalData.current;
      for (const indexPath of indexPaths) {
        const key = getKeyForIndexPath(indexPath);

        // console.log("Clear cell atIndexPath %s", key);
        delete state.cellsForIndexPathes[key];
      }
    },
    []
  );

  const getDistanceForRow = useCallback(
    (index: number): number => {
      const state = internalData.current;
      if (index > state.measuredRow) {
        for (let _index = state.measuredRow + 1; _index <= index; _index++) {
          state.sizeOfRows[_index] = getSizeForRow(_index);
          state.distanceOfRows[_index] =
            index < 1
              ? 0
              : state.distanceOfRows[_index - 1] + state.sizeOfRows[_index - 1];
        }
      }
      const val = state.distanceOfRows[index] ?? 0;
      return val;
    },
    [getSizeForColumn]
  );

  const getDistanceForColumn = useCallback(
    (index: number): number => {
      const state = internalData.current;
      if (index > state.measuredColumn) {
        for (let _index = state.measuredColumn + 1; _index <= index; _index++) {
          state.sizeOfColumns[_index] = getSizeForColumn(_index);
          state.distanceOfColumns[_index] =
            index < 1
              ? 0
              : state.distanceOfColumns[_index - 1] +
                state.sizeOfColumns[_index - 1];
        }
      }
      const val = state.distanceOfColumns[index] ?? 0;
      return val;
    },
    [getSizeForRow]
  );

  const getRectForIndexPath = useCallback(
    (indexPath: ISpreadsheetIndexPath): ISpreadsheetRect => {
      const w = getSizeForColumn(indexPath.column);
      const h = getSizeForRow(indexPath.row);
      const x = getDistanceForColumn(indexPath.column);
      const y = getDistanceForRow(indexPath.row);

      const rect: ISpreadsheetRect = { x, y, w, h };
      return rect;
    },
    [getSizeForRow, getSizeForColumn, getDistanceForColumn, getDistanceForRow]
  );

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
    updater();
  }, []);

  const scrollTo = useCallback(
    (input: { x?: number; y?: number; animated?: boolean }) => {
      if (input.y !== undefined) {
        tableWrapperRef.current?.scrollTo({
          y: Math.max(
            0,
            Math.min(input.y, control.contentSize.h - visibleBodySize.h)
          ),
          animated: input.animated,
        });
      }
      if (input.x !== undefined) {
        tableRef.current?.scrollTo({
          y: Math.max(
            0,
            Math.min(input.x, control.contentSize.w - visibleBodySize.w)
          ),
          animated: input.animated,
        });
      }
    },
    [visibleBodySize]
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
  const renderItemAtIndexPaths = useCallback(
    (indexPaths: ISpreadsheetIndexPath[]) => {
      // Remove rendering cache and trigger rendering
      clearCellCacheForIndexPaths(indexPaths)
      updater();
    },
    [clearCellCacheForIndexPaths]
  );
  const renderItemAtIndexPath = useCallback(
    (indexPath: ISpreadsheetIndexPath) => {
      clearCellCacheForIndexPaths([indexPath]);
      updater();
    },
    [renderItemAtIndexPaths]
  );

  const renderAtColumns = useCallback(
    (columns: number[]) => {
      const indexPaths: ISpreadsheetIndexPath[] = [];
      for (const column of columns) {
        for (let index = 0; index < numRows; index++) {
          indexPaths.push({ row: index, column });
        }
      }
      return renderItemAtIndexPaths(indexPaths);
    },
    [renderItemAtIndexPaths]
  );

  const renderAtRows = useCallback(
    (rows: number[]) => {
      const indexPaths: ISpreadsheetIndexPath[] = [];
      for (const row of rows) {
        for (let index = 0; index < numColumns; index++) {
          indexPaths.push({ row, column: index });
        }
        columnHeaderRef.current?.clearCacheForRow(row);
        tableRef.current?.clearCacheForRow(row);
        rowHeaderRef.current?.clearCacheForRow(row);
        topCornerRef.current?.clearCacheForRow(row);
      }

      return renderItemAtIndexPaths(indexPaths);
    },
    [renderItemAtIndexPaths]
  );

  useImperativeHandle(
    externalRef,
    () => {
      return {
        layout() {
          measureLayout();
          updater();
        },
        resetScrollOffset() {
          measureLayout();
          resetLayout();
        },
        renderAllItems() {
          internalData.current.cellsForIndexPathes = {};

          columnHeaderRef.current?.clearCaches();
          tableRef.current?.clearCaches();
          rowHeaderRef.current?.clearCaches();
          topCornerRef.current?.clearCaches();
          updater();
        },
        renderItemAtIndexPath: renderItemAtIndexPath,
        renderItemsAtIndexPaths: renderItemAtIndexPaths,
        renderItemsAtColumn(column: number) {
          renderAtColumns([column]);
        },
        renderItemsAtColumns(columns: number[]) {
          renderAtColumns(columns);
        },
        renderItemsAtRow(row: number) {
          renderAtRows([row]);
        },
        renderItemsAtRows(rows: number[]) {
          renderAtRows(rows);
        },
        scrollTo: scrollTo,
        scrollToIndexPath(indexPath, animated) {
          const rect = getRectForIndexPath(indexPath);
          scrollTo({ x: rect.x, y: rect.y, animated });
        },
        scrollToRow(row, animated) {
          const distance = getDistanceForRow(row);
          scrollTo({ y: distance, animated });
        },
      };
    },
    [
      measureLayout,
      renderItemAtIndexPath,
      renderItemAtIndexPaths,
      renderAtColumns,
      renderAtRows,
      numColumns,
      numRows,
    ]
  );
  const _cellSpace: ISpreadsheetInnerSpace = useMemo(() => {
    const out = {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    };
    if (typeof cellSpace === "number") {
      out.left = out.top = out.right = out.bottom = cellSpace;
    } else if (typeof cellSpace === "object") {
      out.left = cellSpace.left ?? 0;
      out.right = cellSpace.right ?? 0;
      out.top = cellSpace.top ?? 0;
      out.bottom = cellSpace.bottom ?? 0;
    }
    return out;
  }, [cellSpace]);

  const control: ISpreadsheetViewControlProps = {
    CellComponent: props.CellComponent,
    RowComponent: props.RowComponent,
    numColumns,
    numRows,
    rowStyle,
    cellStyle,
    preloadForRow,
    preloadForColumn,
    renderExtraCells,
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
  }, [sizeForColumn]);

  useEffect(() => {
    if (!layoutReady) return;
    internalData.current.sizeOfRows = {};
    internalData.current.distanceOfRows = {};
    measureLayout();
  }, [sizeForRow]);

  useEffect(() => {
    measureLayout();
  }, []);

  const frozenRowDistance = frozenRows < 1 ? 0 : getDistanceForRow(frozenRows);
  const frozenColumnDistance =
    frozenColumns < 1 ? 0 : getDistanceForColumn(frozenColumns);

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
              styles.topView,
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
                    {
                      width: internalData.current.frozenColumnsX,
                      height: internalData.current.frozenRowsY,
                    },
                  ]}
                  ref={topCornerRef}
                  numRows={_frozenRows}
                  numColumns={_frozenColumns}
                  cellSpace={_cellSpace}
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
                {
                  width: visibleSize.w - internalData.current.frozenColumnsX,
                  height: internalData.current.frozenRowsY,
                },
              ]}
              ref={columnHeaderRef}
              scrollEnabled={false}
              horizontal
              cellSpace={_cellSpace}
              offsetColumn={_frozenColumns}
              distanceColumn={frozenColumnDistance}
              numRows={_frozenRows}
              numColumns={
                numColumns > 0 ? numColumns - _frozenColumns : undefined
              }
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
          style={styles.bodyView}
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
                  styles.bodyLeft,
                  rowHeaderStyle,
                  { width: internalData.current.frozenColumnsX },
                ]}
                ref={rowHeaderRef}
                scrollEnabled={false}
                offsetRow={_frozenRows}
                cellSpace={_cellSpace}
                distanceRow={frozenRowDistance}
                numRows={numRows > 0 ? numRows - _frozenRows : undefined}
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
            scrollEventThrottle={16}
            ref={tableWrapperRef}
            bounces={false}
            alwaysBounceHorizontal={false}
            alwaysBounceVertical={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={true}
            style={[
              styles.bodyGrid,
              contentStyle,
              { width: visibleSize.w - internalData.current.frozenColumnsX },
            ]}
          >
            <SpreadsheetScrollView
              testID="tableBody"
              control={control}
              horizontal={true}
              ref={tableRef}
              bounces={false}
              visibleWidth={visibleBodySize.w}
              visibleHeight={visibleBodySize.h}
              cellSpace={_cellSpace}
              numRows={numRows > 0 ? numRows - _frozenRows : undefined}
              numColumns={
                numColumns > 0 ? numColumns - _frozenColumns : undefined
              }
              offsetRow={_frozenRows}
              distanceRow={frozenRowDistance}
              offsetColumn={_frozenColumns}
              distanceColumn={frozenColumnDistance}
              scrollEnabled={true}
              onMomentumScrollEnd={onBodyHorizontalScroll}
              onScroll={onBodyHorizontalScroll}
              scrollEventThrottle={16}
              scrollsToTop={scrollsToTop}
              contentInset={contentInsets}
              scrollIndicatorInsets={scrollIndicatorInsets}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
            />
          </ScrollView>
        </View>
      )}
    </View>
  );
});
SpreadsheetView.displayName = "SpreadsheetView";
