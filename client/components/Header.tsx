import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, LogOut, Settings, UserRound, Wallet } from "lucide-react";

type SessionUser = { email: string; name: string; role?: string };
type EthereumProvider = { request: (request: { method: string }) => Promise<unknown> };

export default function Header() {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<SessionUser | null>(() => readSessionUser());
  const [isOpen, setIsOpen] = useState(false);
  const [wallet, setWallet] = useState(() => localStorage.getItem("finance_wallet") ?? localStorage.getItem("flare_wallet") ?? "");
  const [walletMessage, setWalletMessage] = useState("");

  useEffect(() => {
    const closeMenu = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const syncSession = () => setUser(readSessionUser());
    const syncProfile = (event: Event) => setUser((event as CustomEvent<SessionUser>).detail);
    document.addEventListener("mousedown", closeMenu);
    window.addEventListener("storage", syncSession);
    window.addEventListener("finance:profile-updated", syncProfile);
    return () => {
      document.removeEventListener("mousedown", closeMenu);
      window.removeEventListener("storage", syncSession);
      window.removeEventListener("finance:profile-updated", syncProfile);
    };
  }, []);

  function signOut() {
    localStorage.removeItem("finance_user");
    sessionStorage.removeItem("finance_user");
    localStorage.removeItem("flare_user");
    sessionStorage.removeItem("flare_user");
    localStorage.removeItem("finance_wallet");
    localStorage.removeItem("flare_wallet");
    setUser(null);
    setWallet("");
    setIsOpen(false);
    navigate("/signin", { replace: true });
  }

  async function connectWallet() {
    const provider = (window as Window & { ethereum?: EthereumProvider }).ethereum;
    if (!provider) {
      setWalletMessage("Install MetaMask or another EVM wallet to connect.");
      return;
    }
    try {
      const accounts = await provider.request({ method: "eth_requestAccounts" }) as string[];
      const address = accounts[0] ?? "";
      if (address) {
        localStorage.setItem("finance_wallet", address);
        setWallet(address);
        setWalletMessage("");
      }
    } catch {
      setWalletMessage("Wallet connection was cancelled or failed.");
    }
  }

  return (
    <header className="w-full border-b border-[#d9e6df] bg-white/90 backdrop-blur-sm" role="banner">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Finance" className="h-10 w-10 rounded-md object-cover" />
          <div>
            <Link to="/dashboard" className="text-lg font-semibold text-[#00382f]">Finance</Link>
            <div className="text-xs text-[#71827d]">Admin demo</div>
          </div>
        </div>

        <nav aria-label="Primary navigation" className="hidden items-center gap-4 text-sm text-[#526761] md:flex">
          <Link to="/dashboard" className="rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#7fb735]">Dashboard</Link>
          <Link to="/erp" className="rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#7fb735]">ERP Payments</Link>
          <Link to="/operations" className="rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#7fb735]">Operations</Link>
          <Link to="/docs" className="rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#7fb735]">Docs</Link>
          <Link to="/settings" className="rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#7fb735]">Settings</Link>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <div ref={menuRef} className="relative">
              <button type="button" onClick={() => setIsOpen((open) => !open)} aria-label="Open user profile menu" aria-expanded={isOpen} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#cbdcd3] bg-[#00382f] text-[#d9f36b] shadow-sm transition hover:border-[#7fb735] focus:outline-none focus:ring-2 focus:ring-[#b8d978]">
                <UserRound size={18} />
              </button>
              {isOpen && <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-[#d9e6df] bg-white p-2 shadow-[0_16px_40px_rgba(0,59,47,0.14)]">
                <div className="border-b border-[#edf1ef] px-3 py-2">
                  <p className="truncate text-sm font-bold text-[#00382f]">{user.name}</p>
                  <p className="truncate text-xs text-[#82918d]">{user.email}</p>
                </div>
                <Link to="/settings" onClick={() => setIsOpen(false)} className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-[#344742] hover:bg-[#f2f8df]"><Settings size={16} className="text-[#4e7e20]" /> Edit profile</Link>
                <button type="button" onClick={connectWallet} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold text-[#344742] hover:bg-[#f2f8df]"><Wallet size={16} className="text-[#4e7e20]" /><span>{wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : "Connect wallet"}</span>{wallet && <Check size={15} className="ml-auto text-[#4e7e20]" />}</button>
                {walletMessage && <output className="block px-3 pb-2 text-xs text-[#36521c]">{walletMessage}</output>}
                <button type="button" onClick={signOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold text-[#9f3e32] hover:bg-[#fff4f1]"><LogOut size={16} /> Sign out</button>
              </div>}
            </div>
          ) : (
            <><Link to="/signup" aria-label="Sign up" className="hidden rounded px-3 py-1 text-sm font-semibold text-[#4e7e20] hover:bg-[#f2f8df] sm:inline-block">Sign up</Link><Link to="/signin" aria-label="Sign in" className="rounded bg-[#00382f] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#075443]">Sign in</Link></>
          )}
        </div>
      </div>
    </header>
  );
}

function readSessionUser(): SessionUser | null {
  const raw = localStorage.getItem("finance_user") ?? sessionStorage.getItem("finance_user") ?? localStorage.getItem("flare_user") ?? sessionStorage.getItem("flare_user");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SessionUser>;
    if (typeof parsed.email !== "string" || typeof parsed.name !== "string") return null;
    localStorage.removeItem("flare_user");
    sessionStorage.removeItem("flare_user");
    (localStorage.getItem("finance_user") ? localStorage : sessionStorage).setItem("finance_user", JSON.stringify(parsed));
    return parsed as SessionUser;
  } catch {
    localStorage.removeItem("flare_user");
    sessionStorage.removeItem("flare_user");
    return null;
  }
}
