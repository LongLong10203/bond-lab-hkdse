import Link from 'next/link';
import { ArrowLeft, Atom, Download } from 'lucide-react';
import './library.css';

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return <main className="library-page">
    <header className="library-header">
      <Link className="brand" href="/"><span className="brand-mark"><Atom size={25}/></span>BONDLAB</Link>
      <div><a className="secondary-button" href="/guides/bond-lab-reactions.pdf" download><Download size={16}/>Download PDF</a>
        <Link className="secondary-button" href="/"><ArrowLeft size={16}/>Back to practice</Link></div>
    </header>
    {children}
    <footer className="library-footer">Examples cover the game’s supported reactions. Diagrams show product species; coefficients and spectator salts are omitted.</footer>
  </main>;
}
