import { DropResult } from '@hello-pangea/dnd';
import { RowSelectionState, Updater } from '@tanstack/react-table';
import React from 'react';
import { useAvailableColumns } from '../api/channels';
import { useRecordCount, useRecordsPaginated } from '../api/records';
import { Order } from '../app.types';
import type { Token } from '../filtering/filterParser';
import { useAppDispatch, useAppSelector } from '../state/hooks';
import { selectAppliedFilters } from '../state/slices/filterSlice';
import { selectQueryParams } from '../state/slices/searchSlice';
import {
  selectSelectedRowsObject,
  setSelectedRows,
} from '../state/slices/selectionSlice';
import {
  changePage,
  changeResultsPerPage,
  changeSort,
  deselectColumn,
  reorderColumn,
  selectColumnStates,
  selectColumnVisibility,
  selectSelectedIds,
  toggleWordWrap,
} from '../state/slices/tableSlice';
import Table from '../table/table.component';

export const extractChannelsFromTokens = (
  appliedFilters: Token[][]
): string[] => {
  let allChannelNames: string[] = [];

  appliedFilters.forEach((f) => {
    // Extract the channel names from the token array
    const channelNames = f
      .filter((f) => f.type === 'channel')
      .map((f) => f.value);
    allChannelNames = [...allChannelNames, ...channelNames];
  });

  // Remove duplicates
  allChannelNames = allChannelNames.filter(
    (f, i) => allChannelNames.indexOf(f) === i
  );
  return allChannelNames;
};

const RecordTable = React.memo(
  (props: {
    openFilters: (headerName: string) => void;
    tableHeight: string;
  }): React.ReactElement => {
    const { openFilters, tableHeight } = props;

    const dispatch = useAppDispatch();

    const appliedFilters = useAppSelector(selectAppliedFilters);
    const queryParams = useAppSelector(selectQueryParams);
    const { sort, page, resultsPerPage, searchParams } = queryParams;
    const { maxShots } = searchParams;

    const { data, isLoading: dataLoading } = useRecordsPaginated();
    const { data: count, isLoading: countLoading } = useRecordCount();
    const { data: availableColumns, isLoading: columnsLoading } =
      useAvailableColumns();

    const availableColumnsNullChecked = React.useMemo(
      () => availableColumns ?? [],
      [availableColumns]
    );

    const columnStates = useAppSelector(selectColumnStates);
    const columnVisibility = useAppSelector((state) =>
      selectColumnVisibility(state, availableColumnsNullChecked)
    );

    const columnOrder = useAppSelector(selectSelectedIds);

    const onPageChange = React.useCallback(
      (page: number) => {
        dispatch(changePage(page));
      },
      [dispatch]
    );

    const onResultsPerPageChange = React.useCallback(
      (resultsPerPage: number) => {
        dispatch(changeResultsPerPage(resultsPerPage));
      },
      [dispatch]
    );

    const selectedRows = useAppSelector(selectSelectedRowsObject);
    const onRowSelectionChange = React.useCallback(
      (newValue: Updater<RowSelectionState>) => {
        const updater = newValue as (
          old: RowSelectionState
        ) => RowSelectionState;

        dispatch(setSelectedRows(updater(selectedRows)));
      },
      [dispatch, selectedRows]
    );

    const handleSort = React.useCallback(
      (column: string, order: Order | null) => {
        dispatch(changeSort({ column, order }));
      },
      [dispatch]
    );

    const handleColumnWordWrapToggle = React.useCallback(
      (column: string): void => {
        dispatch(toggleWordWrap(column));
      },
      [dispatch]
    );

    const handleOnDragEnd = React.useCallback(
      (result: DropResult): void => {
        dispatch(reorderColumn(result));
      },
      [dispatch]
    );

    const handleColumnClose = React.useCallback(
      (column: string): void => {
        dispatch(deselectColumn(column));
      },
      [dispatch]
    );

    const filteredChannelNames = React.useMemo(() => {
      return extractChannelsFromTokens(appliedFilters);
    }, [appliedFilters]);

    return (
      <Table
        tableHeight={tableHeight}
        data={data ?? []}
        availableColumns={availableColumnsNullChecked}
        columnStates={columnStates}
        columnVisibility={columnVisibility}
        columnOrder={columnOrder}
        totalDataCount={count ?? 0}
        maxShots={maxShots}
        page={page}
        loadedData={!dataLoading && !columnsLoading}
        loadedCount={!countLoading}
        resultsPerPage={resultsPerPage}
        onResultsPerPageChange={onResultsPerPageChange}
        onRowSelectionChange={onRowSelectionChange}
        selectedRows={selectedRows}
        onPageChange={onPageChange}
        sort={sort}
        onSort={handleSort}
        onColumnWordWrapToggle={handleColumnWordWrapToggle}
        onDragEnd={handleOnDragEnd}
        onColumnClose={handleColumnClose}
        openFilters={openFilters}
        filteredChannelNames={filteredChannelNames}
      />
    );
  }
);

RecordTable.displayName = 'RecordTable';

export default RecordTable;
