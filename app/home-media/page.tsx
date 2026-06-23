import Link from "next/link";
import { getHomeMedia } from "@/app/src/data/home";
import { Button, PageHeader } from "@/app/src/components/ui";
import HomeMediaTable from "@/app/src/components/HomeMediaTable";

export const dynamic = "force-dynamic";

export default async function HomeMediaPage() {
  const items = await getHomeMedia();

  return (
    <div>
      <PageHeader
        title="Home media"
        subtitle={`${items.length} images & videos on the storefront home page`}
        action={
          <Link href="/home-media/new">
            <Button>+ New media</Button>
          </Link>
        }
      />
      <HomeMediaTable items={items} />
    </div>
  );
}
