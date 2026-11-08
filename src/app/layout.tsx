import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Bond Lab — Organic chemistry, connected.',description:'Build molecules, master reaction conditions and plan organic syntheses. An interactive HKDSE chemistry practice lab.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
