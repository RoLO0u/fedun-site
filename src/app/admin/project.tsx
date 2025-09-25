"use client";

import { useState } from "react";
import { DatePicker } from "@/components/ui/datePicker";

interface ProjectProps {
    label: string;
    date: Date;
    setDate: (date: Date | undefined) => void;
}

export const Project = ({
    label,
    date,
    setDate,
}: ProjectProps) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="flex justify-between items-center sm:min-w-1/2 xs:min-w-1/2 min-w-3/4">
            <h1>{label}</h1>
            <DatePicker open={open} setOpen={setOpen} date={date} setDate={setDate} />
        </div>
    )
}