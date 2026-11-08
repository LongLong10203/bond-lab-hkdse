'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { FAMILIES } from '@/chemistry/rules';
import type { LibraryEntry } from '@/chemistry/library';
import ReactionReference from './reaction-reference';

export default function ReactionLibrary({ entries }: { entries: LibraryEntry[] }) {
  const [family, setFamily] = useState('all');
  const [search, setSearch] = useState('');
  const query = search.trim().toLowerCase();
  const filtered = entries.filter(entry =>
    (family === 'all' || (family === 'cyclic' ? entry.cyclic : entry.family === family)) &&
    [entry.title, entry.familyLabel, ...entry.examples.flatMap(example => [example.label,
      ...example.reactants.map(item => item.label), ...example.products.map(item => item.label),
      ...example.methods.flatMap(method => method.reagents)])].join(' ').toLowerCase().includes(query));
  return <>
    <div className="library-filters">
      <label className="library-search"><Search size={18} aria-hidden="true"/><span className="sr-only">Search reactions</span>
        <input type="search" placeholder="Search reactions, compounds or reagents" value={search} onChange={event => setSearch(event.target.value)}/>
      </label>
      <label className="library-family">Reaction family<select value={family} onChange={event => setFamily(event.target.value)}>
        {FAMILIES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select></label>
    </div>
    <p className="library-count" role="status">{filtered.length} {filtered.length === 1 ? 'reaction' : 'reactions'}</p>
    <div className="library-results">{filtered.map(entry => <ReactionReference key={entry.id} entry={entry}/>)}</div>
    {filtered.length === 0 && <div className="library-empty"><h2>No matching reactions</h2><p>Try a different compound, reagent or reaction family.</p><button className="secondary-button" onClick={() => { setSearch(''); setFamily('all'); }}>Show all reactions</button></div>}
  </>;
}
