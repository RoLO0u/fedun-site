"use client"
 
import { ColumnDef } from "@tanstack/react-table"
 
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
 
export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "name",
    header: "Username", 
  },
  {
    accessorKey: "role",
    header: "Role",
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
  },
  {
    accessorKey: "updatedAt",
    header: "Updated At",
  },
  {
    accessorKey: "emailVerified",
    header: "Email Verified",
  },
  {
    accessorKey: "banned",
    header: "Banned",
  },
]