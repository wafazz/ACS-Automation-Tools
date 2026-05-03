import { useEffect, useRef } from 'react';
import DataTablesCore, { Config, ConfigColumns } from 'datatables.net-bs5';
import 'datatables.net-react';

interface DataTableColumn<T> extends ConfigColumns {
    title: string;
    data?: keyof T & string;
    render?: (data: any, type: string, row: T) => string | number;
    type?: 'num' | 'string' | 'date' | 'html';
    orderable?: boolean;
    searchable?: boolean;
    className?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: DataTableColumn<T>[];
    pageLength?: number;
    searching?: boolean;
    ordering?: boolean;
    paging?: boolean;
    info?: boolean;
    emptyMessage?: string;
    rowId?: keyof T & string;
    extraOptions?: Partial<Config>;
}

export default function DataTable<T extends Record<string, any>>({
    data,
    columns,
    pageLength = 10,
    searching = true,
    ordering = true,
    paging = true,
    info = true,
    emptyMessage = 'No data available',
    rowId,
    extraOptions = {},
}: DataTableProps<T>) {
    const tableRef = useRef<HTMLTableElement>(null);
    const dtRef = useRef<any>(null);

    useEffect(() => {
        if (!tableRef.current) return;

        const numericTargets: number[] = [];
        columns.forEach((col, idx) => {
            if (col.type === 'num') numericTargets.push(idx);
        });

        dtRef.current = new DataTablesCore(tableRef.current, {
            data,
            columns,
            pageLength,
            searching,
            ordering,
            paging,
            info,
            responsive: true,
            autoWidth: false,
            language: {
                search: '',
                searchPlaceholder: 'Search...',
                emptyTable: emptyMessage,
                zeroRecords: 'No matching records found',
                lengthMenu: 'Show _MENU_',
                info: 'Showing _START_ to _END_ of _TOTAL_',
                paginate: {
                    previous: '‹',
                    next: '›',
                    first: '«',
                    last: '»',
                },
            },
            columnDefs: numericTargets.length
                ? [{ type: 'num', targets: numericTargets }]
                : [],
            rowId: rowId,
            ...extraOptions,
        } as Config);

        return () => {
            dtRef.current?.destroy();
            dtRef.current = null;
        };
    }, [data, columns, pageLength, searching, ordering, paging, info, emptyMessage, rowId, extraOptions]);

    return (
        <div className="table-responsive">
            <table
                ref={tableRef}
                className="table table-striped table-hover align-middle w-100"
            >
                <thead className="table-light">
                    <tr>
                        {columns.map((col, idx) => (
                            <th key={idx} className={col.className}>{col.title}</th>
                        ))}
                    </tr>
                </thead>
            </table>
        </div>
    );
}
