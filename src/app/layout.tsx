import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Bond Lab — Organic chemistry, connected.',description:'Build molecules, master reaction conditions and plan organic syntheses. An interactive HKDSE chemistry practice lab.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}<footer className="license-notice" aria-label="Copyright and license"><span>© 2026 Long (LongLong10203)</span><a href="/license.txt" target="_blank" rel="noopener noreferrer">AGPLv3 license</a><a href="https://github.com/LongLong10203/bond-lab-hkdse" target="_blank" rel="noopener noreferrer">Source code</a><span>No warranty. Redistribution permitted under the license.</span></footer></body></html>;}
