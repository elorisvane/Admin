import PostForm from "@/app/src/components/PostForm";
import { PageHeader } from "@/app/src/components/ui";

export default function NewPostPage() {
  return (
    <div>
      <PageHeader title="New journal entry" subtitle="Write a story for the ÉLORIS journal." />
      <PostForm />
    </div>
  );
}
