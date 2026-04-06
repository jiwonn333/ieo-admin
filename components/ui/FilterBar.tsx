import React from 'react';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  tabs: { id: string; label: string; count?: number }[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
}

export function FilterBar({ tabs, activeTab, onTabChange, className }: FilterBarProps) {
  return (
    <div className={cn("flex items-center gap-2 p-1 bg-gray-50/80 rounded-lg w-max border border-gray-100", className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
              isActive 
                ? "bg-white text-gray-900 shadow-sm border border-gray-200" 
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                "ml-2 text-xs px-2 py-0.5 rounded-full",
                isActive ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-500"
              )}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
