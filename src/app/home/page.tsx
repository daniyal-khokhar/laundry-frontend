"use client";

import Link from "next/link";
import { 
  Shirt, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  LayoutDashboard, 
  ArrowRight, 
  TrendingUp, 
  Building2, 
  CreditCard,
  PlusCircle,
  Activity,
  Package,
  ArrowUpRight
} from "lucide-react";

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  const coreModules = [
    { 
      icon: <Layers className="h-5 w-5 text-orange-600" />, 
      title: "Multi-Branch Management", 
      text: "Centralized tracking for active outlets and localized inventory pools." 
    },
    { 
      icon: <Shirt className="h-5 w-5 text-orange-600" />, 
      title: "Intelligent Order Cycles", 
      text: "Monitor real-time item status directly from entry to checkout." 
    },
    { 
      icon: <CreditCard className="h-5 w-5 text-orange-600" />, 
      title: "Ledger & Receipts", 
      text: "Manage customer profiles, invoices, and advance deposits safely." 
    },
    { 
      icon: <TrendingUp className="h-5 w-5 text-orange-600" />, 
      title: "Granular Analytics", 
      text: "Isolate high-performing units and audit revenue graphs instantly." 
    },
  ];

  return (
    <>
      <main className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-orange-600 selection:text-white">
        
        {/* Top Mini Control Navbar Area */}
        {/* <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-black tracking-tight text-slate-900 text-base">DECENT LAUNDRY</span>
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 font-mono text-[10px] px-2 py-0">v2.0 Stable</Badge>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              HQ Server Connected
            </div>
          </div>
        </div> */}

        {/* ================= COMPACT HERO / QUICK METRICS ================= */}
        <section className="py- bg-slate-50/50 border-b border-slate-200">
          <div className="container max-w-7xl mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Side: Dense Copywriting */}
              <div className="lg:col-span-7 space-y-4 text-left">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-tight">
                  Decent Laundry <span className="text-orange-600">Multi-Branch</span> Hub
                </h1>
                
                <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
                  Enterprise-grade management system designed to sync laundry entries, point-of-sale invoices, advance logs, and status queues perfectly across multiple physical branch channels.
                </p>
                
                <div className="flex flex-wrap gap-3 pt-1">
                  <Button  size="sm" className="bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-sm px-5 py-5 rounded-lg transition-all">
                    <Link href="/dashboard">
                      Launch Master Dashboard <LayoutDashboard className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button  variant="outline" size="sm" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 px-5 py-5 rounded-lg shadow-sm">
                    <a href="#system-modules">View Sub-Systems</a>
                  </Button>
                </div>
              </div>

              {/* Right Side: Quick Action Terminal Mockup (Dashboard Panel Style) */}
              <div className="lg:col-span-5">
                <div className="w-full bg-slate-900 p-4 rounded-xl shadow-md border border-slate-800">
                  <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Activity className="h-3 w-3 text-orange-500" /> System Metrics (Live)
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">~14ms Latency</span>
                  </div>

                  {/* Micro Grid Inside Mockup */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <p className="text-[10px] uppercase text-slate-500 font-bold">Today's Load</p>
                      <p className="text-lg font-black text-white mt-0.5">1,161 <span className="text-xs font-normal text-slate-400">Pcs</span></p>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <p className="text-[10px] uppercase text-slate-500 font-bold">Active Outlets</p>
                      <p className="text-lg font-black text-orange-500 mt-0.5">4 Nodes</p>
                    </div>
                  </div>

                  <div className="mt-3 bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Washing & Ironing Capacity</span>
                    <span className="text-emerald-400 font-bold font-mono">78% Optimal</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ================= COMPACT MODULES GRID ================= */}
        <section className="py-12 bg-white" id="system-modules">
          <div className="container max-w-7xl mx-auto px-4 md:px-6">
            
            <div className="mb-8">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Operational Sub-Systems</h2>
              <p className="text-xs text-slate-500 mt-0.5">Integrated backend architecture running operations cleanly.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {coreModules.map((item, i) => (
                <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-xl transition-all hover:bg-slate-100/70 group">
                  <div className="h-9 w-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center group-hover:border-orange-500/40 transition-all mb-3 shadow-sm">
                    {item.icon}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ================= TERMINAL GATEWAY ACCESS ================= */}
        <section className="py-12 bg-slate-50 border-t border-slate-200">
          <div className="container max-w-7xl mx-auto px-4 md:px-6">
            
            <div className="mb-8 text-center sm:text-left">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Gateway Entry Terminals</h2>
              <p className="text-xs text-slate-500 mt-0.5">Direct authentication routing for branch nodes and master headquarters.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
              
              {/* Node 1: Counter Portal */}
              <Card className="flex flex-col border border-slate-200 bg-white rounded-xl shadow-sm hover:border-slate-300 transition-all">
                <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">Counter Terminal</CardTitle>
                    <CardDescription className="text-slate-500 text-[11px]">For on-site branch desk operation.</CardDescription>
                  </div>
                  <Building2 className="h-4 w-4 text-slate-400" />
                </CardHeader>
                <CardContent className="p-4 pt-0 flex-1">
                  <div className="text-xs space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono text-slate-600">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-orange-600 flex-shrink-0" />
                      <span>Instant Booking & Slip Generation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-orange-600 flex-shrink-0" />
                      <span>Live Status Updates (Wash/Iron)</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button  variant="outline" size="sm" className="w-full border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-lg text-xs">
                    <Link href="/branch-login" className="flex items-center justify-center gap-1.5">
                      Open Counter Interface <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              {/* Node 2: HQ Super Console */}
              <Card className="flex flex-col border border-orange-200 bg-white rounded-xl shadow-sm hover:border-orange-300 transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-orange-600 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-bl">
                  HQ ROOT
                </div>
                
                <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">HQ Master Console</CardTitle>
                    <CardDescription className="text-slate-500 text-[11px]">Global architectural audit and controls.</CardDescription>
                  </div>
                  <Sparkles className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent className="p-4 pt-0 flex-1">
                  <div className="text-xs space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono text-slate-600">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5 text-orange-600 flex-shrink-0" />
                      <span>Cross-Branch Analytics & Logs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5 text-orange-600 flex-shrink-0" />
                      <span>Dynamic Branch Node Provisioning</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button  size="sm" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-xs shadow-sm">
                    <Link href="/admin-login" className="flex items-center justify-center gap-1.5">
                      Authorize Admin Session <PlusCircle className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

            </div>

          </div>
        </section>
      </main>
    </>
  );
}