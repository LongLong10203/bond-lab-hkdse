import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { reactionLibrary } from '@/chemistry/library';
import ReactionReference from '@/components/reaction-reference';

export function generateStaticParams() {
  return reactionLibrary().map(entry => ({ id: entry.id }));
}
export default async function ReactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = reactionLibrary().find(item => item.id === id);
  if (!entry) notFound();
  return <>
    <Link className="library-back" href="/library"><ArrowLeft size={16}/>All reactions</Link>
    <section className="library-intro library-detail-intro"><h1>Review this reaction</h1><p>Choose a complete set of options, then return to your answer.</p></section>
    <ReactionReference entry={entry} detail/>
  </>;
}
