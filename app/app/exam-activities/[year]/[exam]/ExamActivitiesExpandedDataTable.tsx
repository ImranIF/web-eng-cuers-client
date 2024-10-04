"use client";

import {
    ColumnDef,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    VisibilityState
} from "@tanstack/table-core";
import {
    ColumnFiltersState,
    flexRender,
    useReactTable
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import React, {useState} from "react";
import {DataTablePagination} from "@/components/ui/DataTablePagination";
import {DataTableViewOptions} from "@/components/ui/DataTableViewOptions";
import FooterCell from "@/components/table/FooterCell";
import {useQueries} from "@tanstack/react-query";
import {QueryKey} from "@/utils/queryKeys";
import {handleSelectOptions} from "@/utils/SelectOptionsHandler";
import {fetchData} from "@/utils/fetchData";
import {DataTable} from "@/components/ui/data-table";
import {
    subColumns
} from "@/app/app/exam-activities/[year]/[exam]/ExamActivitiesColumn";
import {Collapsible, CollapsibleContent} from "@/components/ui/collapsible";

interface DataTableProps<TData, TValue, T1Data, T2Value> {
    columns: ColumnDef<TData, TValue>[]
    subColumns?: ColumnDef<T1Data, T2Value>[]
    newRow: TData,
    newSubRow?: T1Data,
    defaultData: TData[],
    onCreate: (newRow: TData) => Promise<TData | undefined>,
    onUpdate: (updatedRow: TData) => Promise<TData | undefined>
    onDelete: (row: TData) => Promise<TData | undefined>
}

export function ExpandedDataTable<TData, TValue, T1Data, T2Value>({
                                                                      columns,
                                                                      newSubRow,
                                                                      defaultData,
                                                                      onUpdate,
                                                                      onCreate,
                                                                      onDelete,
                                                                      newRow,
                                                                  }: DataTableProps<TData, TValue, T1Data, T2Value>) {
    const [data, setData] = useState(() => [...defaultData]);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});
    const [originalData, setOriginalData] = useState(() => [...defaultData]);


    const referencedTables = columns
        .filter((column) => column.meta?.fetchOptionsInfo)
        .map((column) => {
            const {key, fetch_url} = column.meta?.fetchOptionsInfo || {};
            return column?.meta?.fetchOptionsInfo;
        });


    const queries = useQueries({
        queries: referencedTables.map((table) => {
            return {
                queryKey: [table?.key],
                queryFn: async () => fetchData(table?.fetch_url ?? "").then((data) => {
                    console.log(data);
                    handleSelectOptions(table?.key as QueryKey, data.data);
                    return data.data;
                }),
            }
        })
    })
    const [editedRows, setEditedRows] = useState({});
    const [expanded, setExpanded] = React.useState<Array<string>>([]);

    const table = useReactTable({
        data, columns, getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        autoResetPageIndex: false,
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
            columnFilters, columnVisibility, rowSelection,
        },
        meta: {
            addRow: async (newRow: TData) => {
                const setFunc = (old: TData[]) => [...old, newRow];
                // table.lastPage();
                const addedRow = await onCreate(newRow);
                if (addedRow != undefined) {
                    setData(setFunc);
                    setOriginalData(setFunc);
                }
            },
            removeRow: async (rowIndex: number) => {
                console.log("To be removed: ", data[rowIndex]);
                const row = await onDelete(data[rowIndex]);
                if (row != undefined) {
                    const filterFunc = (old: TData[]) => old.filter((_row, index) => index != rowIndex);
                    setData(filterFunc);
                    setOriginalData(filterFunc);
                }
            },
            revertData: (rowIndex: number) => {
                setData((old) =>
                    old.map((row, index) => index == rowIndex ? originalData[rowIndex] : row));
            },
            updateRow: async (rowIndex: number) => {
                const updatedRow = await onUpdate(data[rowIndex]);
                console.log("After updating: ", updatedRow);
                if (updatedRow != undefined) {
                    const updateFunc = (old: TData[]) => old.map((row, index) => index == rowIndex ? data[rowIndex] : row);
                    setOriginalData(updateFunc);
                }
            },
            removeSelectedRows: (selectedRows: number[]) => {
                // TODO: Needs fix more multiple deletion
                const filterFunc = (rowIndex: number) => (old: TData[]) => old.filter((_row, index) => index != rowIndex);
                selectedRows.map(async (index) => {
                        const deleted = await onDelete(data[index])
                        if (deleted != undefined) {
                            setData(filterFunc(index));
                            setOriginalData(filterFunc(index));
                        }
                    }
                );
                // check if all deleted successfully, if not deleted
                // successfully on item will be undefined
                //  if all get successfully deleted
            },
            updateData: (rowIndex: number, columnId: string, value: string) => {
                setData((oldData) =>
                    oldData.map((row, index) => {
                        if (index == rowIndex) {
                            return {
                                ...oldData[rowIndex], [columnId]: value
                            };
                        }
                        return row;
                    }))
            },
            editedRows, setEditedRows,
            expanded, setExpanded: (id: string) => {
                if (expanded.includes(id)) {
                    setExpanded(expanded.filter((item) => item != id));
                } else {
                    setExpanded([...expanded, id]);
                }
            }
        }
    })
    return (
        <div>
            <div
                className="flex flex-row gap-2 items-center justify-between py-4">
                {/*<Input*/}
                {/*    placeholder="Filter Exam Activity Names"*/}
                {/*    value={(table.getColumn("exam_activity_name")?.getFilterValue() as string) ?? ""}*/}
                {/*    onChange={(event) =>*/}
                {/*        table.getColumn("exam_activity_name")?.setFilterValue(event.target.value)*/}
                {/*    }*/}
                {/*    className="max-w-sm"*/}
                {/*/>*/}
                <div
                    className={"flex flex-row gap-2 justify-between w-full"}>
                    <FooterCell table={table} newRow={newRow}/>
                    <DataTableViewOptions table={table}/>
                </div>
            </div>
            <div className={"rounded-lg border"}>
                <Table className={""}>
                    <TableHeader className={"bg-foreground/5"}>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {
                                    headerGroup.headers.map((header) => {
                                        return (
                                            <TableHead key={header.id}>
                                                {header.isPlaceholder ? null : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                            </TableHead>
                                        );
                                    })
                                }
                            </TableRow>))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <>
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && "selected"}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}
                                                       className={"text-bold"}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                    <TableCell
                                        colSpan={row.getVisibleCells().length}
                                        className={""}>

                                        <Collapsible
                                            open={expanded.includes(row.id)}
                                            onOpenChange={() => setExpanded}>
                                            <CollapsibleContent>
                                                <DataTable
                                                    columns={subColumns as any}
                                                    newRow={newSubRow as any}
                                                    showPagination={false}
                                                    viewOptions={false}
                                                    defaultData={(row.original as {
                                                        factor_information: []
                                                    }).factor_information}
                                                    onCreate={onCreate}
                                                    showSpacerBelow={false}
                                                    onUpdate={onUpdate}
                                                    onDelete={onDelete}/>
                                            </CollapsibleContent>
                                        </Collapsible>
                                    </TableCell>
                                </>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length}
                                           className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <DataTablePagination table={table} className={"mt-4"}/>
            <div className={"py-16"}></div>
        </div>
    );
}
