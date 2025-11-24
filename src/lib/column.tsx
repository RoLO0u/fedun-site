"use client"
 
import * as React from "react";
import { Column, ColumnDef, Row, Table } from "@tanstack/react-table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { PenLineIcon } from "lucide-react";
import { DeleteUserDialog, ToggleBanUser, ToggleEmailVerification } from "@/components/userAdminAction";
import { Dialog } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

export type User = {
  id: string
  email: string
  name: string
  emailVerified: boolean
  createdAt: string
  updatedAt: string
  role: string
  banned: boolean
  banReason: string | null
  banExpires: string | null
  image: string | null
}

function SortHeader({
  column,
  title,
}: {
  column: Column<User, unknown>
  title: string
}) {
  return (
    <button onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
      {title}
    </button>
  )
}
 
export const columns: ColumnDef<User>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "email",
      header: ({ column }) => <SortHeader column={column} title="Email" />,
  },
  {
    accessorKey: "name",
      header: ({ column }) => <SortHeader column={column} title="Username" />,
  },
  {
    accessorKey: "role",
      header: ({ column }) => <SortHeader column={column} title="Role" />,
  },
  {
    accessorKey: "createdAt",
      header: ({ column }) => <SortHeader column={column} title="Created At" />,
    cell: ({ row }) => {
      return new Date(row.original.createdAt).toLocaleDateString()
    }
  },
  {
    accessorKey: "updatedAt",
      header: ({ column }) => <SortHeader column={column} title="Updated At" />,
    cell: ({ row }) => {
      return new Date(row.original.updatedAt).toLocaleDateString()
    }
  },
  {
    accessorKey: "emailVerified",
      header: ({ column }) => <SortHeader column={column} title="Email Verified" />,
  },
  {
    accessorKey: "banned",
      header: ({ column }) => <SortHeader column={column} title="Banned" />,
    cell: ({ row, table }) => {
      return <UserActionsCell row={row} table={table} />
    }
  },
]

type DialogVariant = "verify" | "ban" | "delete" | null;

function UserActionsCell({
  row,
  table,
}: {
  row: Row<User>
  table: Table<User>
}) {
  const [dialog, setDialog] = React.useState<DialogVariant>(null);

  const closeDialog = () => setDialog(null);

  return (
    <div className="flex flex-row justify-center items-center gap-1">
      {row.original.banned ? "Yes" : "No"}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <PenLineIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            onSelect={() => {
              setDialog("verify");
            }}
          >
            {row.original.emailVerified ? "Unverify" : "Verify"} user email
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant={row.original.banned ? "default" : "destructive"}
            onSelect={() => {
              setDialog("ban");
            }}
          >
            {row.original.banned ? "Unban" : "Ban"} User
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => {
              setDialog("delete");
            }}
          >
            Delete user
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialog === "verify"} onOpenChange={(open) => !open && closeDialog()}>
        {dialog === "verify" && (
          <ToggleEmailVerification
            userId={row.original.id}
            verify={row.original.emailVerified}
            setVerify={(verify: boolean) => {
              table.options.meta?.updateData(row.index, "emailVerified", verify)
              closeDialog()
            }}
          />
        )}
      </Dialog>
      <Dialog open={dialog === "ban"} onOpenChange={(open) => !open && closeDialog()}>
        {dialog === "ban" && (
          <ToggleBanUser
            userId={row.original.id}
            banned={row.original.banned}
            setBanned={(banned: boolean) => {
              table.options.meta?.updateData(row.index, "banned", banned)
              closeDialog()
            }}
          />
        )}
      </Dialog>
      <Dialog open={dialog === "delete"} onOpenChange={(open) => !open && closeDialog()}>
        {dialog === "delete" && (
          <DeleteUserDialog
            userId={row.original.id}
            onDeleted={() => {
              table.options.meta?.removeRow(row.index)
              closeDialog()
            }}
          />
        )}
      </Dialog>
    </div>
  )
}