import Link from "next/link";
import { getPosts } from "@/app/src/data/posts";
import { Button, PageHeader } from "@/app/src/components/ui";
import PostsTable from "@/app/src/components/PostsTable";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div>
      <PageHeader
        title="Journal"
        subtitle={`${posts.length} entries`}
        action={
          <Link href="/blog/new">
            <Button>+ New entry</Button>
          </Link>
        }
      />

      <PostsTable posts={posts} />
    </div>
  );
}
