"use client";

import React from "react";

export default function MobileSkeletonDashboard() {
  return (
    <div className="pb-28 min-h-screen bg-[#F8FAFC] dark:bg-slate-950 select-none animate-fadeIn pt-4">

      {/* 5. Bento Grid Skeleton */}
      <div className="px-4 mt-4 space-y-3">
        <div className="w-36 h-3 bg-slate-200 dark:bg-slate-800 rounded-md animate-shimmer px-1" />
        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: LMS Large */}
          <div className="col-span-2 h-36 rounded-3xl bg-white dark:bg-slate-900 p-4 border border-slate-200/80 dark:border-slate-800 animate-shimmer" />
          {/* Card 2 & 3: Tahfidz & Mutabaah */}
          <div className="h-28 rounded-3xl bg-white dark:bg-slate-900 p-3.5 border border-slate-200/80 dark:border-slate-800 animate-shimmer" />
          <div className="h-28 rounded-3xl bg-white dark:bg-slate-900 p-3.5 border border-slate-200/80 dark:border-slate-800 animate-shimmer" />
          {/* Card 4: SPP Row */}
          <div className="col-span-2 h-16 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 animate-shimmer" />
        </div>
      </div>

      {/* 6. Quick Actions Grid Skeleton */}
      <div className="px-4 mt-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800">
          <div className="w-32 h-3 bg-slate-200 dark:bg-slate-800 rounded-md animate-shimmer mb-4" />
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-shimmer" />
                <div className="w-8 h-2 bg-slate-100 dark:bg-slate-800 rounded-md animate-shimmer" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
