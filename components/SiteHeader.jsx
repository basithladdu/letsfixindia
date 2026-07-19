"use client";
import Link from "next/link";
import { useState } from "react";
const links = [["/timeline","Timeline"],["/voices","Voices"],["/statistics","Statistics"],["/sources","Sources"],["/faq","Help"],["/about","About"]];
export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  return <>
    <header className="topbar"><Link className="brand" href="/" onClick={() => setOpen(false)}><span className="brand-mark" aria-hidden="true" /><span>LetsFixIndia</span></Link><nav className="topnav" aria-label="Main navigation">{links.map(([href,label]) => <Link key={href} href={href}>{label}</Link>)}</nav><button className="menu-toggle" type="button" aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen(true)}><span className="menu-bar" /><span className="menu-bar" /><span className="menu-bar" /></button></header>
    {open && <button className="nav-backdrop is-open" aria-label="Close navigation" onClick={() => setOpen(false)} />}
    <nav className={`side-nav${open ? " is-open" : ""}`} aria-label="Mobile navigation" aria-hidden={!open}><div className="side-nav-head">Navigate <button className="menu-close" type="button" aria-label="Close navigation" onClick={() => setOpen(false)}>x</button></div>{links.map(([href,label]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}</nav>
  </>;
}
