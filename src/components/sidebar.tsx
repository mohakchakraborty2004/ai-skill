// src/components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/actions/auth.action";

export default function Sidebar() {
  const pathname = usePathname();
  const navigate = useRouter();
  const navItems = [
    { name: "Evaluator", href: "/getScore" },
    { name: "Dashboard", href: "/dashboard" },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-full bg-[#050505] border-r border-[#1a1a1a] text-gray-400">
      
      {/* Brand / Logo Area */}
      <div className="p-8 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded border-2 border-[#b026ff] flex items-center justify-center bg-black">
            <span className="text-[#b026ff] font-bold text-[10px]">DI</span>
          </div>
          <h1 className="text-white font-bold tracking-widest text-sm">DEV INSIGHT</h1>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-6 space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-4 ml-2">Menu</p>
        
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-3 rounded-lg transition-all duration-300 ${
                isActive 
                  ? "bg-[#12051c] text-[#b026ff] border border-[#2a0d45] shadow-[0_0_10px_rgba(176,38,255,0.1)]" 
                  : "hover:bg-[#0a0a0a] hover:text-white border border-transparent"
              }`}
            >
              <span className="text-sm font-semibold">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout Footer */}
      <div className="p-6 border-t border-[#1a1a1a]">
        <button 
          onClick={async () => {
            await logout();
            navigate.push("/login");
          }}
          className="w-full flex items-center justify-center px-4 py-3 rounded-lg border border-red-900/30 text-red-500 hover:bg-red-950/20 hover:text-red-400 transition-all duration-300 text-sm font-semibold"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}