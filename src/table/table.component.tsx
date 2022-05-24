import React from "react";
import { Record } from "../app.types";
import { Column, useTable } from "react-table";
import {
  TableContainer as MuiTableContainer,
  Table as MuiTable,
  TableHead as MuiTableHead,
  TableBody as MuiTableBody,
  TableRow as MuiTableRow,
  TableCell as MuiTableCell,
  Paper,
} from "@mui/material";

interface TableProps {
  data: Record[];
  columns: Column[];
  totalDataCount: number;
  page: number | null;
  loadedData: boolean;
  loadedCount: boolean;
  resultsPerPage: number;
  onPageChange: (page: number) => void;
}

const Table = React.memo((props: TableProps): React.ReactElement => {
  const {
    data,
    columns,
    totalDataCount,
    loadedData,
    loadedCount,
    resultsPerPage,
    onPageChange,
  } = props;

  const [maxPage, setMaxPage] = React.useState(1);

  const page = React.useMemo(() => {
    return props.page && props.page > 0 ? props.page : 1;
  }, [props.page]);

  React.useEffect(() => {
    if (loadedCount) {
      const newMaxPage = ~~(1 + (totalDataCount - 1) / resultsPerPage);
      if (newMaxPage !== maxPage) {
        setMaxPage(newMaxPage);
      } else if (maxPage > 0 && page > newMaxPage) {
        onPageChange(1);
      }
    }
  }, [
    loadedCount,
    maxPage,
    onPageChange,
    page,
    resultsPerPage,
    totalDataCount,
  ]);

  const tableInstance = useTable({ columns, data });

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    tableInstance;

  return (
    <div>
      {loadedData && totalDataCount > 0 ? (
        <div>
          <div>
            <MuiTableContainer component={Paper}>
              <MuiTable {...getTableProps()}>
                <MuiTableHead>
                  {headerGroups.map((headerGroup) => {
                    const { key, ...otherHeaderGroupProps } =
                      headerGroup.getHeaderGroupProps();
                    return (
                      <MuiTableRow key={key} {...otherHeaderGroupProps}>
                        {headerGroup.headers.map((column) => {
                          const { key, ...otherHeaderProps } =
                            column.getHeaderProps();
                          return (
                            <MuiTableCell key={key} {...otherHeaderProps}>
                              {column.render("Header")}
                            </MuiTableCell>
                          );
                        })}
                      </MuiTableRow>
                    );
                  })}
                </MuiTableHead>
                <MuiTableBody {...getTableBodyProps()}>
                  {rows.map((row) => {
                    prepareRow(row);
                    const { key, ...otherRowProps } = row.getRowProps();
                    return (
                      <MuiTableRow key={key} {...otherRowProps}>
                        {row.cells.map((cell) => {
                          const { key, ...otherCellProps } =
                            cell.getCellProps();
                          return (
                            <MuiTableCell key={key} {...otherCellProps}>
                              {cell.render("Cell")}
                            </MuiTableCell>
                          );
                        })}
                      </MuiTableRow>
                    );
                  })}
                </MuiTableBody>
              </MuiTable>
            </MuiTableContainer>
          </div>
          <div>
            <p>
              Page count: {page}/{Math.ceil(totalDataCount / resultsPerPage)}
            </p>
          </div>
          <div>
            <button onClick={() => onPageChange(page - 1 >= 1 ? page - 1 : 1)}>
              Previous
            </button>
            <button
              onClick={() => page + 1 <= maxPage && onPageChange(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p>Loading...</p>
        </div>
      )}
    </div>
  );
});

export default Table;
