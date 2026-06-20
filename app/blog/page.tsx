import Link from "next/link";
import { getPosts } from "@/app/src/data/posts";
import { Button, Card, PageHeader } from "@/app/src/components/ui";

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

      <Card>
        <ul className="divide-y divide-border">
          {posts.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/blog/${p.slug}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-gold-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-foreground">{p.title}</p>
                  <p className="mt-0.5 text-xs text-muted">{p.excerpt}</p>
                </div>
                <div className="ml-6 shrink-0 text-right">
                  <p className="text-xs uppercase tracking-wider text-muted">
                    {p.category}
                  </p>
                  <p className="mt-0.5 text-xs text-muted/70">{p.date}</p>
                </div>
              </Link>
            </li>
          ))}
          {posts.length === 0 && (
            <li className="px-5 py-10 text-center text-muted">No journal entries yet.</li>
          )}
        </ul>
      </Card>
    </div>
  );
}
