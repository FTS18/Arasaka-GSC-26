import React from "react";

const Shimmer = () => <div className="tc-skeleton-shimmer absolute inset-0" />;

export const CardSkeleton = () => (
  <div className="tc-card">
    <div className="flex justify-between items-start">
      <div className="space-y-2 w-3/4">
        <div className="tc-skeleton h-3 w-20 overflow-hidden relative"><Shimmer /></div>
        <div className="tc-skeleton h-6 w-full overflow-hidden relative"><Shimmer /></div>
      </div>
      <div className="tc-skeleton h-5 w-16 overflow-hidden relative"><Shimmer /></div>
    </div>
    <div className="mt-4 space-y-2">
      <div className="tc-skeleton h-4 w-full overflow-hidden relative"><Shimmer /></div>
      <div className="tc-skeleton h-4 w-5/6 overflow-hidden relative"><Shimmer /></div>
    </div>
    <div className="mt-4 tc-skeleton h-10 w-full overflow-hidden relative"><Shimmer /></div>
  </div>
);

export const ChartSkeleton = () => (
  <div className="tc-card h-[300px] flex flex-col justify-end p-6">
    <div className="flex items-end gap-2 h-full">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div 
          key={i} 
          className="tc-skeleton flex-1 overflow-hidden relative" 
          style={{ height: `${Math.random() * 80 + 20}%` }}
        >
          <Shimmer />
        </div>
      ))}
    </div>
  </div>
);

export const StatSkeleton = () => (
  <div className="tc-card p-6">
    <div className="tc-skeleton h-3 w-24 mb-2 overflow-hidden relative"><Shimmer /></div>
    <div className="tc-skeleton h-10 w-16 overflow-hidden relative"><Shimmer /></div>
  </div>
);

export const TableRowSkeleton = () => (
  <tr>
    <td className="py-4 px-4"><div className="tc-skeleton h-4 w-8 relative overflow-hidden"><Shimmer /></div></td>
    <td className="py-4 px-4"><div className="tc-skeleton h-4 w-40 relative overflow-hidden"><Shimmer /></div></td>
    <td className="py-4 px-4"><div className="tc-skeleton h-4 w-20 relative overflow-hidden"><Shimmer /></div></td>
    <td className="py-4 px-4"><div className="tc-skeleton h-4 w-12 relative overflow-hidden"><Shimmer /></div></td>
    <td className="py-4 px-4"><div className="tc-skeleton h-4 w-24 relative overflow-hidden"><Shimmer /></div></td>
    <td className="py-4 px-4"><div className="tc-skeleton h-4 w-20 relative overflow-hidden ml-auto"><Shimmer /></div></td>
  </tr>
);
