import { supabase } from "../lib/supabase";

export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  image: string;
  /** Article body as an array of paragraphs. */
  body: string[];
}

interface PostRow {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  read_time: string;
  image: string;
  body: string[] | null;
}

export function mapPost(row: PostRow): Post {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category,
    date: row.date,
    readTime: row.read_time,
    image: row.image,
    body: row.body ?? [],
  };
}

export async function getPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapPost);
}

export async function getPost(slug: string): Promise<Post | undefined> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPost(data) : undefined;
}
