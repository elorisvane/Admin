import { getReviews } from "@/app/src/data/reviews";
import { PageHeader } from "@/app/src/components/ui";
import ReviewsTable from "@/app/src/components/ReviewsTable";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const reviews = await getReviews();
  const hidden = reviews.filter((r) => r.status === "hidden").length;

  return (
    <div>
      <PageHeader
        title="Reviews"
        subtitle={
          reviews.length === 0
            ? "No reviews yet"
            : `${reviews.length} ${reviews.length === 1 ? "review" : "reviews"}` +
              (hidden ? ` · ${hidden} hidden` : "")
        }
      />
      <ReviewsTable reviews={reviews} />
    </div>
  );
}
