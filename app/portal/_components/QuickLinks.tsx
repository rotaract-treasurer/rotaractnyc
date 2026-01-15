'use client';

interface QuickLink {
  label: string;
  href: string;
}

export default function QuickLinks() {
  const links: QuickLink[] = [
    { label: "Submit Service Hours", href: "/portal" },
    { label: "Member Directory", href: "/portal/directory" },
    { label: "Pay Dues", href: "/portal/finance" },
    { label: "Bylaws", href: "/portal/docs" },
  ];

  return (
    <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-[#2a2a2a] p-5">
      <h3 className="text-[#141414] dark:text-white text-base font-bold mb-3">
        Quick Links
      </h3>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="px-3 py-2 bg-gray-50 dark:bg-[#2a2a2a] hover:bg-gray-100 dark:hover:bg-[#333] rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}
