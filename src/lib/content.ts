import { getCollection, type CollectionEntry } from 'astro:content';

export type Section = 'posts' | 'projects';
export type Article = CollectionEntry<Section>;

export async function publishedEntries(section: Section) {
  const entries = await getCollection(section, ({ data }) => !data.draft);
  return entries.sort((a, b) =>
    b.data.date.valueOf() - a.data.date.valueOf() || a.id.localeCompare(b.id),
  );
}

export function articleUrl(entry: Article) {
  return `/${entry.collection}/${entry.id.split('/').map(encodeURIComponent).join('/')}/`;
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  }).format(date);
}
