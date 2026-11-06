"use server";

import { getAllPosts } from "@/lib/db/postActions";

export const dynamic = "force-dynamic";

const postsPage = async () => {
  const posts = await getAllPosts();
  posts.sort((a, b) => {
    if (a.updatedAt && b.updatedAt) {
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    }
    return 0;
  });
  return (
    <div className="flex flex-col gap-4 mt-5">
      <h1 className="text-2xl font-bold">Posts</h1>
      <div className="flex flex-col gap-2">
        {posts.map((post) => (
          <div key={post.id} className="flex flex-col">
            <a href={`/post/${post.id}`} className="text-lg hover:underline">
              {post.title}
            </a>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Last updated:{" "}
              {post.updatedAt?.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default postsPage;