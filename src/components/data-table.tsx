"use client"
 
import {
  ColumnDef,
  SortingState,
  getSortedRowModel,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  RowSelectionState,
} from "@tanstack/react-table";
 
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Button } from "./ui/button";
import React from "react";
 
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  setData: React.Dispatch<React.SetStateAction<TData[] | null>>
  onSelectionChange?: (rows: TData[]) => void
  clearSelectionSignal?: number
}

type DataTableMeta = {
  updateData: (rowIndex: number, columnId: string, value: unknown) => void
  removeRow: (rowIndex: number) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  setData,
  onSelectionChange,
  clearSelectionSignal,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "createdAt", desc: false }
  ])
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})

  const table = useReactTable<TData>({
    data,
    columns,
    meta: {
      updateData: (rowIndex: number, columnId: string, value: unknown) => {
        setData((old) => {
          if (old === null) return [];
          return old.map((row, index) =>
            index === rowIndex
              ? { ...row, [columnId]: value }
              : row )
          }
        );
      },
      removeRow: (rowIndex: number) => {
        setData((old) => {
          if (!old) return [];
          return old.filter((_, index) => index !== rowIndex);
        });
      },
    } satisfies DataTableMeta,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      rowSelection,
    },
  })

  React.useEffect(() => {
    if (!onSelectionChange) return;
    const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original);
    onSelectionChange(selectedRows);
  }, [rowSelection, table, onSelectionChange])

  React.useEffect(() => {
    if (clearSelectionSignal === undefined) return;
    table.resetRowSelection();
  }, [clearSelectionSignal, table])
 
  return (
    <div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  )
}