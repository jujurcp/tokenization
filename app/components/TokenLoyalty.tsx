"use client";

import React, { useMemo, useState } from "react";

/**
 * TokenLoyalty – one‑file starter site + interactive prototype (no backend)
 * ------------------------------------------------------------------------
 * What you get:
 * - A polished landing page for a tokenized loyalty platform.
 * - A live prototype panel where you can simulate: connect wallet (mock),
 *   create a program, simulate a purchase, issue points/tokens at fixed value,
 *   redeem, and inspect a ledger — all client‑side.
 *
 * How to use:
 * - Drop into a Next.js or Vite React project as a page/component.
 * - Replace MOCKs with real services over time (see TODOs near the bottom).
 * - Ship fast on Vercel/Netlify now; add backend later.
 */

// --- Helpers ---------------------------------------------------------------
const fmt = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" });
const short = (s: string) => (s.length <= 10 ? s : `${s.slice(0, 6)}…${s.slice(-4)}`);

// Types
type Program = {
  id: string;
  name: string;
  tokenSymbol: string; // e.g., IHEART, GSHARK
  fixedCentsPerPoint: number; // 100 = $1.00 fixed value per point
  earnRatePct: number; // % of purchase returned as points at fixed value
  breakagePct: number; // expected unredeemed (for modeling only)
};

type Wallet = {
  address: string;
  network: "demo" | "eth" | "sol";
};

// Demo seed
const DEMO_PROGRAMS: Program[] = [
  { id: "p1", name: "Gotham Sports Rewards", tokenSymbol: "GOTH", fixedCentsPerPoint: 100, earnRatePct: 5, breakagePct: 15 },
  { id: "p2", name: "Street Child Impact Cash", tokenSymbol: "IMPT", fixedCentsPerPoint: 100, earnRatePct: 3, breakagePct: 0 },
  { id: "p3", name: "Kraken Club Cashback", tokenSymbol: "KRAK", fixedCentsPerPoint: 100, earnRatePct: 4, breakagePct: 10 },
];

// In‑memory demo ledger
type LedgerRow = { ts: number; type: "ISSUE" | "REDEEM"; programId: string; amountPts: number; amountUsd: number; note?: string };

export default function TokenLoyalty() {
  // --- Landing page controls
  const [navOpen, setNavOpen] = useState(false);
  // --- Prototype state
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [programs, setPrograms] = useState<Program[]>(DEMO_PROGRAMS);
  const [selected, setSelected] = useState<string>(programs[0].id);
  const [purchaseUsd, setPurchaseUsd] = useState<number>(120);
  const [balances, setBalances] = useState<Record<string, number>>({}); // programId -> pts
  const [ledger, setLedger] = useState<LedgerRow[]>([]);

  const activeProgram = useMemo(() => programs.find(p => p.id === selected)!, [programs, selected]);
  const activeBalance = balances[selected] || 0;

  // Derived
  const earnValueUsd = useMemo(() => (purchaseUsd * activeProgram.earnRatePct) / 100, [purchaseUsd, activeProgram]);
  const ptsPerDollar = 100 / activeProgram.fixedCentsPerPoint; // 1.00 -> 1 point
  const earnPts = Math.round(earnValueUsd * ptsPerDollar * 100) / 100; // keep two decimals of points

  // --- Handlers -----------------------------------------------------------
  function mockConnect(network: Wallet["network"]) {
    const addr = `${network === "sol" ? "SoL" : network === "eth" ? "0x" : "demo"}${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 6)}`;
    setWallet({ address: addr, network });
  }

  function issuePoints() {
    if (!wallet) return alert("Connect a wallet first (mock).");
    if (purchaseUsd <= 0) return alert("Enter a purchase amount > 0.");
    const next = { ...balances };
    next[selected] = (next[selected] || 0) + earnPts;
    setBalances(next);
    setLedger([{ ts: Date.now(), type: "ISSUE", programId: selected, amountPts: earnPts, amountUsd: earnValueUsd, note: `Purchase ${fmt.format(purchaseUsd)}` }, ...ledger]);
  }

  function redeem(amountPts: number) {
    if (!wallet) return alert("Connect a wallet first (mock).");
    if (amountPts <= 0) return alert("Enter a positive amount.");
    if (amountPts > activeBalance) return alert("Not enough balance.");
    const usd = (amountPts / ptsPerDollar);
    const next = { ...balances };
    next[selected] = activeBalance - amountPts;
    setBalances(next);
    setLedger([{ ts: Date.now(), type: "REDEEM", programId: selected, amountPts, amountUsd: usd, note: "Checkout (gift card / bill credit)" }, ...ledger]);
  }

  function addProgram(p: Omit<Program, "id">) {
    const id = `p${Math.random().toString(36).slice(2, 7)}`;
    setPrograms([{ id, ...p }, ...programs]);
    setSelected(id);
  }

  function resetAll() {
    setBalances({});
    setLedger([]);
    setPrograms(DEMO_PROGRAMS);
    setSelected(DEMO_PROGRAMS[0].id);
    setWallet(null);
  }

  // Export current state as JSON (to show how you'd ship data to a backend)
  function exportState() {
    const blob = new Blob([JSON.stringify({ wallet, programs, balances, ledger }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tokenloyalty-demo-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // --- UI ----------------------------------------------------------------
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* NAV */}
      <header className="border-b sticky top-0 z-30 bg-white/70 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-2xl bg-black"></div>
            <span className="font-semibold tracking-tight">TokenLoyalty</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a className="hover:opacity-70" href="#how">How it works</a>
            <a className="hover:opacity-70" href="#demo">Live demo</a>
            <a className="hover:opacity-70" href="#pricing">Pricing</a>
            <a className="hover:opacity-70" href="#faq">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 text-sm rounded-xl border" onClick={() => setNavOpen(!navOpen)}>Menu</button>
            <a href="#demo" className="px-4 py-2 text-sm rounded-xl bg-black text-white">Launch Demo</a>
          </div>
        </div>
        {navOpen && (
          <div className="md:hidden border-t">
            <div className="max-w-6xl mx-auto grid gap-2 p-4 text-sm">
              <a className="py-2" href="#how" onClick={() => setNavOpen(false)}>How it works</a>
              <a className="py-2" href="#demo" onClick={() => setNavOpen(false)}>Live demo</a>
              <a className="py-2" href="#pricing" onClick={() => setNavOpen(false)}>Pricing</a>
              <a className="py-2" href="#faq" onClick={() => setNavOpen(false)}>FAQ</a>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mt-16">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl font-semibold leading-tight">
              Launch a tokenized loyalty program in days — not months.
            </h1>
            <p className="mt-4 text-gray-600 text-lg">
              Fixed‑value, brand‑safe tokens that feel like points — with crypto‑grade portability when you want it. Issue on purchase, redeem at checkout, or donate in a tap.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#demo" className="px-5 py-3 rounded-2xl bg-black text-white">Try the live prototype</a>
              <a href="#how" className="px-5 py-3 rounded-2xl border">See how it works</a>
            </div>
            <p className="mt-3 text-xs text-gray-500">No wallet required for demo. No blockchain risk. Swap in your infra later.</p>
          </div>
          <div className="border rounded-3xl p-5 shadow-sm">
            <div className="rounded-2xl border p-4 bg-gray-50">
              <div className="text-sm text-gray-600">Preview</div>
              <div className="mt-2 text-xl font-medium">Issue → Hold → Redeem flow</div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <div className="rounded-xl bg-white p-3 border">Affiliate signal</div>
                <div className="rounded-xl bg-white p-3 border">Issue fixed‑value token</div>
                <div className="rounded-xl bg-white p-3 border">Redeem at checkout</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mt-20">
        <h2 className="text-2xl font-semibold">How it works</h2>
        <div className="mt-6 grid md:grid-cols-3 gap-6">
          {[
            {
              t: "Track purchases",
              d: "Use affiliate webhooks or order APIs to confirm net purchases in real‑time.",
            },
            {
              t: "Issue fixed‑value tokens",
              d: "Mint brand tokens pegged to $1.00 per point — feels like points, portable like tokens.",
            },
            {
              t: "Redeem anywhere",
              d: "Checkout credits, gift cards, or bill credits. Enable donations with one tap.",
            },
          ].map((x, i) => (
            <div key={i} className="border rounded-2xl p-5">
              <div className="text-sm text-gray-500">Step {i + 1}</div>
              <div className="mt-1 font-medium">{x.t}</div>
              <p className="mt-2 text-gray-600 text-sm">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DEMO */}
      <section id="demo" className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mt-20">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Live prototype</h2>
          <div className="flex gap-2">
            <button onClick={exportState} className="px-3 py-2 text-sm rounded-xl border">Export JSON</button>
            <button onClick={resetAll} className="px-3 py-2 text-sm rounded-xl border">Reset</button>
          </div>
        </div>

        {/* Connect */}
        <div className="mt-6 grid md:grid-cols-3 gap-6">
          <div className="border rounded-2xl p-5">
            <div className="text-sm text-gray-500">1. Wallet (mock)</div>
            {wallet ? (
              <div className="mt-2">
                <div className="text-sm">Connected: <span className="font-mono">{short(wallet.address)}</span> on <span className="uppercase">{wallet.network}</span></div>
                <button className="mt-3 px-3 py-2 text-sm rounded-xl border" onClick={() => setWallet(null)}>Disconnect</button>
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button className="px-3 py-2 text-sm rounded-xl border" onClick={() => mockConnect("demo")}>Demo</button>
                <button className="px-3 py-2 text-sm rounded-xl border" onClick={() => mockConnect("eth")}>ETH</button>
                <button className="px-3 py-2 text-sm rounded-xl border" onClick={() => mockConnect("sol")}>SOL</button>
              </div>
            )}
            <p className="mt-3 text-xs text-gray-500">Swap in RainbowKit / Phantom later.</p>
          </div>

          {/* Program selector */}
          <div className="border rounded-2xl p-5">
            <div className="text-sm text-gray-500">2. Program</div>
            <select value={selected} onChange={e => setSelected(e.target.value)} className="mt-2 w-full border rounded-xl p-2">
              {programs.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.tokenSymbol})</option>
              ))}
            </select>
            <div className="mt-3 text-sm grid grid-cols-2 gap-3">
              <div className="rounded-xl border p-3">
                <div className="text-gray-500 text-xs">Earn rate</div>
                <div className="font-medium">{activeProgram.earnRatePct}%</div>
              </div>
              <div className="rounded-xl border p-3">
                <div className="text-gray-500 text-xs">Fixed value</div>
                <div className="font-medium">{fmt.format(activeProgram.fixedCentsPerPoint/100)} / pt</div>
              </div>
            </div>
            <details className="mt-3">
              <summary className="text-sm font-medium cursor-pointer">Create a new program</summary>
              <ProgramForm onCreate={addProgram} />
            </details>
          </div>

          {/* Purchase simulation */}
          <div className="border rounded-2xl p-5">
            <div className="text-sm text-gray-500">3. Simulate purchase</div>
            <label className="text-sm">Amount</label>
            <input type="number" value={purchaseUsd} onChange={e => setPurchaseUsd(parseFloat(e.target.value) || 0)} className="mt-1 w-full border rounded-xl p-2" />
            <div className="mt-3 text-sm">
              <div className="flex items-center justify-between"><span>Earn value</span><span className="font-medium">{fmt.format(earnValueUsd)}</span></div>
              <div className="flex items-center justify-between"><span>Points to issue</span><span className="font-medium">{earnPts}</span></div>
            </div>
            <button className="mt-3 w-full px-3 py-2 text-sm rounded-xl bg-black text-white" onClick={issuePoints}>Issue to wallet</button>
            <p className="mt-2 text-xs text-gray-500">In production, call your issuer/mint API after an approved order webhook.</p>
          </div>
        </div>

        {/* Balances & redeem */}
        <div className="mt-6 grid md:grid-cols-3 gap-6">
          <div className="border rounded-2xl p-5">
            <div className="text-sm text-gray-500">Balance</div>
            <div className="mt-2 text-3xl font-semibold">{activeBalance} <span className="text-base font-normal text-gray-500">{activeProgram.tokenSymbol}</span></div>
            <div className="mt-1 text-sm text-gray-500">~ {fmt.format(activeBalance / ptsPerDollar)}</div>
          </div>

          <div className="border rounded-2xl p-5">
            <div className="text-sm text-gray-500">Redeem</div>
            <RedeemForm max={activeBalance} onRedeem={redeem} />
            <p className="mt-2 text-xs text-gray-500">For gift cards or bill credit, swap pts → USD at fixed value and fulfill.</p>
          </div>

          <div className="border rounded-2xl p-5">
            <div className="text-sm text-gray-500">Program health (est.)</div>
            <div className="mt-2 text-sm grid grid-cols-2 gap-3">
              <div className="rounded-xl border p-3">
                <div className="text-gray-500 text-xs">Breakage</div>
                <div className="font-medium">{activeProgram.breakagePct}%</div>
              </div>
              <div className="rounded-xl border p-3">
                <div className="text-gray-500 text-xs">Liability (est)</div>
                <div className="font-medium">{fmt.format((activeBalance / ptsPerDollar) * (1 - activeProgram.breakagePct/100))}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Ledger */}
        <div className="mt-6 border rounded-2xl p-5">
          <div className="text-sm text-gray-500">Ledger</div>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2">Time</th>
                  <th>Type</th>
                  <th>Program</th>
                  <th className="text-right">Pts</th>
                  <th className="text-right">USD</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {ledger.length === 0 && (
                  <tr><td className="py-4 text-gray-500" colSpan={6}>No activity yet.</td></tr>
                )}
                {ledger.map((r, i) => {
                  const p = programs.find(x => x.id === r.programId)!;
                  return (
                    <tr key={i} className="border-t">
                      <td className="py-2">{new Date(r.ts).toLocaleString()}</td>
                      <td><span className={`px-2 py-1 rounded-full text-xs ${r.type === "ISSUE" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{r.type}</span></td>
                      <td>{p.name}</td>
                      <td className="text-right">{r.amountPts}</td>
                      <td className="text-right">{fmt.format(r.amountUsd)}</td>
                      <td>{r.note || ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mt-20">
        <h2 className="text-2xl font-semibold">Pricing</h2>
        <div className="mt-6 grid md:grid-cols-3 gap-6">
          {[
            { name: "Builder", price: "$0", items: ["Hosted demo", "Email support", "CSV exports"] },
            { name: "Growth", price: "$499/mo", items: ["Custom domain", "Webhook/API", "SSO (Beta)"] },
            { name: "Enterprise", price: "Talk to us", items: ["SLA & SOC2", "On‑prem issuer", "Custom rails"] },
          ].map((p, i) => (
            <div key={i} className="border rounded-2xl p-6">
              <div className="text-xl font-medium">{p.name}</div>
              <div className="text-3xl mt-2 font-semibold">{p.price}</div>
              <ul className="mt-3 text-sm text-gray-600 list-disc pl-5">
                {p.items.map((it, j) => <li key={j}>{it}</li>)}
              </ul>
              <a href="#demo" className="mt-4 inline-block px-4 py-2 rounded-xl bg-black text-white">Get started</a>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mt-20 mb-24">
        <h2 className="text-2xl font-semibold">FAQ</h2>
        <div className="mt-6 grid gap-4">
          {[
            ["Is this crypto?", "It can be. The demo uses fixed‑value points that can later be bridged to tokens on‑chain when you enable it."],
            ["What networks are supported?", "Start off‑chain. Later, enable popular EVM chains or Solana with your preferred wallet kit."],
            ["How do you fund redemptions?", "Use affiliate revenue, vendor discounts, or a dedicated budget. The fixed value model keeps accounting simple."],
          ].map(([q, a], i) => (
            <details key={i} className="border rounded-2xl p-5">
              <summary className="font-medium cursor-pointer">{q}</summary>
              <p className="mt-2 text-gray-600 text-sm">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t">
        <div className="max-w-6xl mx-auto p-6 text-sm text-gray-500">
          © {new Date().getFullYear()} TokenLoyalty. Built with ❤️ for speed of learning.
        </div>
      </footer>
    </div>
  );
}

function ProgramForm({ onCreate }: { onCreate: (p: Omit<Program, "id">) => void }) {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [value, setValue] = useState(100); // cents per point
  const [earn, setEarn] = useState(5);
  const [breakage, setBreakage] = useState(10);

  return (
    <div className="mt-3 grid gap-2">
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Program name" className="w-full border rounded-xl p-2" />
      <div className="grid grid-cols-3 gap-2">
        <input value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} placeholder="Token symbol" className="w-full border rounded-xl p-2" />
        <input type="number" value={value} onChange={e => setValue(parseInt(e.target.value || "0", 10))} className="w-full border rounded-xl p-2" placeholder="Cents per point" />
        <input type="number" value={earn} onChange={e => setEarn(parseFloat(e.target.value || "0"))} className="w-full border rounded-xl p-2" placeholder="Earn %" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="text-sm text-gray-500 col-span-2">Expected breakage</div>
        <input type="number" value={breakage} onChange={e => setBreakage(parseFloat(e.target.value || "0"))} className="w-full border rounded-xl p-2" />
      </div>
      <button
        className="mt-1 px-3 py-2 text-sm rounded-xl bg-black text-white"
        onClick={() => {
          if (!name || !symbol) return alert("Name & symbol required");
          onCreate({ name, tokenSymbol: symbol, fixedCentsPerPoint: Math.max(1, value), earnRatePct: Math.max(0, earn), breakagePct: Math.max(0, breakage) });
          setName(""); setSymbol(""); setValue(100); setEarn(5); setBreakage(10);
        }}
      >Create program</button>
    </div>
  );
}

function RedeemForm({ max, onRedeem }: { max: number; onRedeem: (pts: number) => void }) {
  const [pts, setPts] = useState(0);
  return (
    <div>
      <label className="text-sm">Points</label>
      <input type="number" min={0} max={max} value={pts} onChange={e => setPts(parseFloat(e.target.value || "0"))} className="mt-1 w-full border rounded-xl p-2" />
      <button className="mt-3 w-full px-3 py-2 text-sm rounded-xl border" onClick={() => onRedeem(pts)}>Redeem</button>
      <div className="mt-2 text-xs text-gray-500">Max: {max}</div>
    </div>
  );
}

/**
 * TODO → wire to real infra when ready
 * - Auth: Clerk/Auth0; DB: Supabase/Postgres.
 * - Webhooks: capture order/affiliate events; write to ledger table.
 * - Issuer service: off‑chain ledger (points) + optional on‑chain mint proxy.
 * - Wallets: RainbowKit (EVM) / Phantom (Solana) gated behind feature flags.
 * - Redemption: generate gift card codes or create checkout credits via partner API.
 * - Admin: program settings, reports, export to CSV, liability dashboard.
 */
