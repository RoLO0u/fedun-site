import Link from "next/link";

export default function Home() {
  return (
    <>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Welcome to Fedun.Site</h1>
        <div>
          <Link href="/analyze" className="text-xl hover:underline">
            Analyze your telegram chats and get insights about your messages, users, and more
          </Link>
          <p className="text-gray-500 dark:text-gray-400">Last updated: 20 April, 2025</p>
        </div>
      </div>
    </>
  );
}
