import Link from "next/link";
import { getHomeMediaItem } from "@/app/src/data/home";
import HomeMediaForm from "@/app/src/components/HomeMediaForm";
import { PageHeader } from "@/app/src/components/ui";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getHomeMediaItem(id);

  if (!item) {
    return (
      <div>
        <PageHeader title="Not found" subtitle={`No home media with id “${id}”.`} />
        <Link href="/home-media" className="text-gold-500 hover:text-gold-600">
          ← Back to home media
        </Link>
      </div>
    );
  }

  const label = item.title || item.alt || "Home media";

  return (
    <div>
      <PageHeader title={label} subtitle="Edit this home page item." />
      <HomeMediaForm initial={item} />
    </div>
  );
}
