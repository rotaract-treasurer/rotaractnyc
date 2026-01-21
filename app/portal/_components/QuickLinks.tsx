'use client';

import { useState } from 'react';
import LogServiceHoursModal from './LogServiceHoursModal';

interface QuickLink {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: string;
}

export default function QuickLinks() {
  const [showServiceHoursModal, setShowServiceHoursModal] = useState(false);

  const links: QuickLink[] = [
    { 
      label: "Log Service Hours", 
      onClick: () => setShowServiceHoursModal(true),
      icon: "volunteer_activism"
    },
    { label: "Member Directory", href: "/portal/directory", icon: "group" },
    { label: "Pay Dues", href: "/portal/finance", icon: "payments" },
    { label: "Bylaws", href: "/portal/docs", icon: "description" },
  ];

  return (
    <>
      <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-[#2a2a2a] p-5">
        <h3 className="text-[#141414] dark:text-white text-base font-bold mb-3">
          Quick Links
        </h3>
        <div className="flex flex-wrap gap-2">
          {links.map((link, index) => {
            if (link.onClick) {
              return (
                <button
                  key={index}
                  onClick={link.onClick}
                  className="px-3 py-2 bg-gray-50 dark:bg-[#2a2a2a] hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary transition-colors border border-transparent hover:border-primary/30 dark:hover:border-primary/30 flex items-center gap-1.5"
                >
                  {link.icon && (
                    <span className="material-symbols-outlined text-base">
                      {link.icon}
                    </span>
                  )}
                  {link.label}
                </button>
              );
            }
            
            return (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-2 bg-gray-50 dark:bg-[#2a2a2a] hover:bg-gray-100 dark:hover:bg-[#333] rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600 flex items-center gap-1.5"
              >
                {link.icon && (
                  <span className="material-symbols-outlined text-base">
                    {link.icon}
                  </span>
                )}
                {link.label}
              </a>
            );
          })}
        </div>
      </div>

      <LogServiceHoursModal
        isOpen={showServiceHoursModal}
        onClose={() => setShowServiceHoursModal(false)}
        onSuccess={() => {
          // Optionally refresh the page or trigger a refresh of recent hours
          window.location.reload();
        }}
      />
    </>
  );
}

