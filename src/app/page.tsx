import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-grow flex-col mt-5 gap-4">
      <h1 className="text-2xl font-bold">Welcome to Fedun.Site</h1>
      <div>
        <Link href="/analyze" className="text-xl hover:underline">
          Analyze telegram chats
        </Link>
        <p className="text-gray-500 dark:text-gray-400">Last updated: June 20, 2025</p>
      </div>
      <div>
        <Link href="https://t.me/paces_bot" target="_blank" className="text-xl hover:underline">
          Sticker Packs Bot
        </Link>
        <p className="text-gray-500 dark:text-gray-400">Last updated: April 5, 2025</p>
      </div>
    </main>
  );
}
