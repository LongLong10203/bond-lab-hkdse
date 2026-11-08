import type { Metadata } from 'next';
import { reactionLibrary } from '@/chemistry/library';
import ReactionLibrary from '@/components/reaction-library';

export const metadata: Metadata = { title: 'Reaction library | Bond Lab' };
export default function LibraryPage() {
  return <>
    <section className="library-intro"><p className="welcome-eyebrow">LEARN THE REACTIONS</p><h1>Reaction library</h1><p>Reaction diagrams and the exact options to select in the game.</p></section>
    <ReactionLibrary entries={reactionLibrary()}/>
  </>;
}
