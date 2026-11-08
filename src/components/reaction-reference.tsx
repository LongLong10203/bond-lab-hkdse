'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';
import type { LibraryEntry } from '@/chemistry/library';
import MoleculeView from './molecule';

export default function ReactionReference({ entry, detail = false }: { entry: LibraryEntry; detail?: boolean }) {
  const [selected, setSelected] = useState(0);
  const example = entry.examples[selected];
  return <article className="reference-card" aria-labelledby={`title-${entry.id}`}>
    <header className="reference-heading">
      <div>
        <p className="reference-family">{entry.cyclic ? 'Cyclic compounds · ' : ''}{entry.familyLabel}</p>
        <h2 id={`title-${entry.id}`}>{detail ? entry.title : <Link href={`/library/${entry.id}`}>{entry.title}</Link>}</h2>
      </div>
      {entry.examples.length > 1 && <label className="reference-variant">Example
        <select aria-label={`Example for ${entry.title}`} value={selected} onChange={event => setSelected(Number(event.target.value))}>
          {entry.examples.map((item, index) => <option key={index} value={index}>{item.label}</option>)}
        </select>
      </label>}
    </header>
    <div className="reference-equation" role="region" aria-label={`${entry.title} reaction diagram`} tabIndex={0}>
      <div className="reference-species-row">
        {example.reactants.map((item, index) => <Fragment key={`reactant-${index}`}>
          {index > 0 && <Plus className="reference-plus" size={17} aria-label="plus"/>}
          <figure><MoleculeView molecule={item.molecule} label={item.label}/><figcaption>{item.label}</figcaption></figure>
        </Fragment>)}
        <ArrowRight className="reference-arrow" size={28} aria-label="forms"/>
        {example.products.map((item, index) => <Fragment key={`product-${index}`}>
          {index > 0 && <Plus className="reference-plus" size={17} aria-label="plus"/>}
          <figure><MoleculeView molecule={item.molecule} label={item.label}/><figcaption>{item.label}</figcaption></figure>
        </Fragment>)}
      </div>
    </div>
    <div className="reference-methods" role="region" aria-label={`Options for ${entry.title}`} tabIndex={0}>
      <table>
        <caption>Choose one complete row.</caption>
        <thead><tr><th scope="col">Reagent option(s)</th><th scope="col">Catalyst</th><th scope="col">Heating</th><th scope="col">Extra option</th></tr></thead>
        <tbody>{example.methods.map((method, index) => <tr key={index}>
          <td>{method.reagents.join(' + ') || 'None'}</td>
          <td>{method.catalyst}</td>
          <td>{method.heating.join(' or ')}</td>
          <td>{method.extra.join(' + ') || 'None'}</td>
        </tr>)}</tbody>
      </table>
    </div>
    {entry.note && <p className="reference-note">{entry.note}</p>}
  </article>;
}
