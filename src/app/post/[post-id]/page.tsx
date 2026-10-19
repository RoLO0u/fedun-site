"use server";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { getPostById } from "@/lib/db/postActions";
import { MDXRemote } from "next-mdx-remote/rsc";
import {
  AlertCircleIcon,
  BookOpenIcon
} from "lucide-react";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import GithubSlugger from 'github-slugger';

function getHeadings(source: string) {
  const slugger = new GithubSlugger();
  
  const headingLines = source.split('\n').filter((line) => {
    return line.match(/^##?\s/);
  });

  return headingLines.map((raw) => {
    const level = raw.startsWith('##') ? 3 : 2;
    const text = raw
      .replace(/^##?\s/, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/<[^>]+>/g, '')
      .replace(/[`*]/g, '')
      .trim();
    
    return { 
      text, 
      level, 
      id: slugger.slug(text) 
    };
  });
}

const mdxComponents = {
  Alert: (props: any) => <Alert className="w-fit my-1" {...props} />,
  AlertTitle,
  AlertDescription,
  Button,
  Popover,
  PopoverTrigger: (props: any) => <PopoverTrigger className="w-fit flex items-center gap-1 underline decoration-dashed" {...props} />,
  PopoverContent: (props: any) => <PopoverContent className="w-screen md:w-2xl" {...props} />,
  AlertCircleIcon: (props: any) => <AlertCircleIcon className="w-4 h-4 inline-block align-middle" {...props} />,
  BookOpenIcon: (props: any) => <BookOpenIcon className="w-4 h-4 inline-block align-middle" {...props} />,
  h1: (props: any) => <h1 className="text-3xl font-bold mt-3 mb-3 flex items-center gap-1 flex-wrap" {...props} />,
  h2: (props: any) => <h2 className="text-xl font-semibold mt-2 mb-1 flex items-center gap-1 flex-wrap" {...props} />,
  p: (props: any) => <p className="not-first:mt-1 wrap-break-word" {...props} />,
  a: (props: any) => <a className="font-medium text-primary underline underline-offset-4" target="_blank" rel="noopener noreferrer" {...props} />,
};

const postPage = async ({
  params,
}: {
  params: Promise<{ "post-id": string }>;
}) => {
  const postId = (await params)["post-id"];
  const post = await getPostById(postId);

  if (!post) {
    return (
      <div className="flex flex-col grow items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
        <p className="text-lg text-muted-foreground">
          The post you are looking for does not exist.
        </p>
      </div>
    );
  }

  const headings = getHeadings(post.content);

  const dateTime = {
    published: {
      year: post.publishedAt?.getFullYear(),
      month: post.publishedAt?.getMonth()! + 1,
      day: post.publishedAt?.getDate(),
      hours: post.publishedAt?.getHours(),
      minutes: post.publishedAt?.getMinutes(),
    },
    updated: {
      year: post.updatedAt?.getFullYear(),
      month: post.updatedAt?.getMonth()! + 1,
      day: post.updatedAt?.getDate(),
      hours: post.updatedAt?.getHours(),
      minutes: post.updatedAt?.getMinutes(),
    },
  };

  const formattedDateTime = {
    published: {
      year: dateTime.published.year,
      month: dateTime.published.month?.toString().padStart(2, '0'),
      day: dateTime.published.day?.toString().padStart(2, '0'),
      hours: dateTime.published.hours?.toString().padStart(2, '0'),
      minutes: dateTime.published.minutes?.toString().padStart(2, '0'),
    },
    updated: {
      year: dateTime.updated.year,
      month: dateTime.updated.month?.toString().padStart(2, '0'),
      day: dateTime.updated.day?.toString().padStart(2, '0'),
      hours: dateTime.updated.hours?.toString().padStart(2, '0'),
      minutes: dateTime.updated.minutes?.toString().padStart(2, '0'),
    },
  };

  return (
    <div className="py-10 px-4 flex flex-col lg:flex-row gap-10">
      <article className="flex grow min-w-0 w-full flex-col">
        <h1 className="text-5xl flex justify-center items-center font-extrabold mb-2">{post.title}</h1>
        <p className="text-muted-foreground text-sm flex justify-center items-center">
          Published on {formattedDateTime.published.day}.{formattedDateTime.published.month}.{formattedDateTime.published.year} at {formattedDateTime.published.hours}:{formattedDateTime.published.minutes}
        </p>
        <p className="text-muted-foreground text-sm flex justify-center items-center">
          Last updated on {formattedDateTime.updated.day}.{formattedDateTime.updated.month}.{formattedDateTime.updated.year} at {formattedDateTime.updated.hours}:{formattedDateTime.updated.minutes}
        </p>
        <MDXRemote 
          source={post.content} 
          components={mdxComponents}
          options={{
            mdxOptions: {
              rehypePlugins: [
                rehypeSlug,
                [rehypePrettyCode, {
                  theme: "github-dark",
                  keepBackground: true,
                }]
              ]
            }
          }}
        />
      </article>
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-20">
          <h4 className="text-sm font-semibold uppercase tracking-wider mb-4 text-muted-foreground">
            On this page
          </h4>
          <nav className="flex flex-col gap-2 text-sm">
            {headings.map((heading) => (
              <a 
                key={heading.id} 
                href={`#${heading.id}`}
                className={`text-muted-foreground hover:text-foreground transition-colors ${
                  heading.level === 3 ? 'ml-4' : '' // Indent H3s
                }`}
              >
                {heading.text}
              </a>
            ))}
          </nav>
        </div>
      </aside>
    </div>
  );
}

export default postPage;