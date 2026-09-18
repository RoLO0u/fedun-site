"use client";
import { FC } from "react";
import Link from "next/link";
import { ExternalLinkIcon, MonitorIcon, SmartphoneIcon, SlashIcon } from "lucide-react";
import { lastUpdatedType } from "@/lib/db/lastUpdatedTypes";

interface Props {
  lastUpdatedData: lastUpdatedType[];
};

const HomePage: FC<Props> = ({ lastUpdatedData }) => {
    const formatedDates = Object();
    
    lastUpdatedData.map(item => {
        const date = new Date(item.date);
        formatedDates[`date${item.id}`] =
            date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric"
            }
        )
    });

    return (
        <main className="flex grow flex-col mt-5 gap-4">
        <h1 className="text-2xl font-bold">Welcome to Fedun.Site</h1>
        <div>
            <Link href="/analyze" className="text-xl flex flex-row items-center hover:underline">
                Analyze telegram chats
                <div className="ml-2 relative inline-flex items-center justify-center">
                    <SmartphoneIcon className="w-5 h-5" />
                    <SlashIcon className="absolute inset-auto m-auto w-5 h-5 -scale-x-100 scale-y-75" />
                </div>
                <MonitorIcon className="w-5 h-5 ml-2"/>
            </Link>
            <p className="text-gray-500 dark:text-gray-400">Last updated: { formatedDates['date0'] }</p>
        </div>
        <div>
            <Link href="https://t.me/paces_bot" target="_blank" className="text-xl hover:underline">
                <p className="flex gap-2 items-center">Sticker Packs Bot <ExternalLinkIcon className="w-5 h-5 mb-0.5"/></p>
            </Link>
            <p className="text-gray-500 dark:text-gray-400">Last updated: { formatedDates['date1'] }</p>
        </div>
        <div>
            <Link href="/l" className="text-xl flex flex-row items-center hover:underline">
                URL Shortener
                <SmartphoneIcon className="w-5 h-5 mb-0.5 ml-2"/>
                <MonitorIcon className="w-5 h-5 mb-0.5 ml-2"/>
            </Link>
            <p className="text-gray-500 dark:text-gray-400">Last updated: { formatedDates['date2'] }</p>
        </div>
        <div>
            <Link href="/sticker-sets" className="text-xl flex flex-row items-center hover:underline">
                Sticker Sets
                <SmartphoneIcon className="w-5 h-5 mb-0.5 ml-2"/>
                <MonitorIcon className="w-5 h-5 mb-0.5 ml-2"/>
            </Link>
            <p className="text-gray-500 dark:text-gray-400">Last updated: { formatedDates['date3'] }</p>
        </div>
        </main>
    );
}

export default HomePage;