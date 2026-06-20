import Link from "next/link";
import { getPost } from "@/app/src/data/posts";
import PostForm from "@/app/src/components/PostForm";
import { PageHeader } from "@/app/src/components/ui";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return (
      <div>
        <PageHeader title="Not found" subtitle={`No journal entry with slug “${slug}”.`} />
        <Link href="/blog" className="text-gold-500 hover:text-gold-600">
          ← Back to journal
        </Link>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={post.title} subtitle="Edit this entry." />
      <PostForm initial={post} />
    </div>
  );
}
