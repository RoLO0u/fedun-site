"use client"
 
import { Column, ColumnDef } from "@tanstack/react-table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { PenLineIcon } from "lucide-react";
import { ToggleEmailVerification } from "@/components/userAdminAction";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";

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

const sortHeader = (title: string) => {
  return ({ column }: { column: Column<User, unknown> }) => {
    return (
      <button
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
        {title}
      </button>
    )
  }
}
 
export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "email",
    header: sortHeader("Email"),
  },
  {
    accessorKey: "name",
    header: sortHeader("Username",) 
  },
  {
    accessorKey: "role",
    header: sortHeader("Role"),
  },
  {
    accessorKey: "createdAt",
    header: sortHeader("Created At"),
    cell: ({ row }) => {
      return new Date(row.original.createdAt).toLocaleDateString()
    }
  },
  {
    accessorKey: "updatedAt",
    header: sortHeader("Updated At"),
    cell: ({ row }) => {
      return new Date(row.original.updatedAt).toLocaleDateString()
    }
  },
  {
    accessorKey: "emailVerified",
    header: sortHeader("Email Verified"),
  },
  {
    accessorKey: "banned",
    header: sortHeader("Banned"),
    cell: ({ row, table }) => {
      return (
        <div className="flex flex-row justify-center items-center gap-1">
          {row.original.banned ? "Yes" : "No"}
          <Dialog>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <PenLineIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DialogTrigger asChild>
                  <DropdownMenuItem>
                    {row.original.emailVerified ? "Unverify" : "Verify"} user email
                  </DropdownMenuItem>
                </DialogTrigger>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant={row.original.banned ? "default" : "destructive"}>
                  {row.original.banned ? "Unban": "Ban"} User
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive">Delete user</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ToggleEmailVerification
              userId={row.original.id}
              verify={row.original.emailVerified}
              setVerify={(verify: boolean) => 
                table.options.meta.updateData(row.index, "emailVerified", verify)
              }
            />
          </Dialog>
        </div>
      )
    }
  },
]