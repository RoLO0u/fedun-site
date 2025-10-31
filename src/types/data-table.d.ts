import '@tanstack/react-table';

declare module '@tanstack/react-table' {
  interface TableMeta<TData, TValue> {
    updateData?: (rowIndex: number, columnId: string, value: unknown) => void;
  }
}