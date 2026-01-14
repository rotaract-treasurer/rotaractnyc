'use client'

import { useEffect, useMemo, useState } from 'react'
import { DEFAULT_BOARD_MEMBERS } from '@/lib/content/members'
import Image from 'next/image'

type MemberRow = {
  id: string
  title: string
  name: string
  role: string
  photoUrl?: string
  order: number
  linkedinUrl?: string
}

export default function BoardPage() {
  const [boardMembers, setBoardMembers] = useState<MemberRow[]>(
    DEFAULT_BOARD_MEMBERS.map((m) => ({
      id: m.id,
      title: m.title,
      name: m.name,
      role: m.role,
      photoUrl: m.photoUrl,
      order: m.order,
      linkedinUrl: undefined,
    }))
  )

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        const res = await fetch('/api/public/members?group=board')
        if (!res.ok) return

        const json: unknown = await res.json()
        const rows =
          typeof json === 'object' &&
          json &&
          Array.isArray((json as { members?: unknown }).members)
            ? ((json as { members: unknown[] }).members as unknown[])
            : []

        const mapped = rows
          .map((m): MemberRow => {
            const obj = typeof m === 'object' && m ? (m as Record<string, unknown>) : {}
            const order = Number(obj.order)
            return {
              id: String(obj.id ?? ''),
              title: String(obj.title ?? ''),
              name: String(obj.name ?? ''),
              role: String(obj.role ?? ''),
              photoUrl: String(obj.photoUrl ?? '') || undefined,
              linkedinUrl: String(obj.linkedinUrl ?? '') || undefined,
              order: Number.isFinite(order) ? order : 1,
            }
          })
          .filter((m) => m.id && m.title && m.name)

        if (!cancelled && mapped.length > 0) {
          setBoardMembers(mapped)
        }
      } catch {
        // ignore and keep defaults
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [])

  const sorted = useMemo(() => [...boardMembers].sort((a, b) => a.order - b.order), [boardMembers])

  return (
    <main className="flex-grow w-full max-w-[1280px] mx-auto px-6 lg:px-12 py-12 lg:py-20">
      {/* Page Header */}
      <section className="max-w-3xl mx-auto text-center mb-16 lg:mb-24 space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#101918] dark:text-white leading-[1.1]">
          Our Leadership
        </h1>
        <p className="text-lg text-[#57606a] dark:text-[#a0aeb2] font-normal leading-relaxed max-w-2xl mx-auto">
          Meet the dedicated Board of Directors guiding the strategic vision and community impact of the Rotaract Club of NYC for the 2024–2025 term.
        </p>
      </section>

      {/* Director Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10">
        {sorted.map((member) => (
          <article
            key={member.id}
            className="group relative flex flex-col bg-white dark:bg-[#1c2b29] border border-[#E0E2E5] dark:border-[#2a3836] rounded shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] hover:border-[#196659]/50 dark:hover:border-[#196659]/50 transition-all duration-300 overflow-hidden h-full"
          >
            <div className="aspect-[4/5] w-full overflow-hidden relative bg-[#E0E2E5] dark:bg-[#2a3836]">
              {member.photoUrl ? (
                <Image
                  src={member.photoUrl}
                  alt={`Portrait of ${member.name}`}
                  width={400}
                  height={500}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#57606a] dark:text-[#a0aeb2]">
                  <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            
            <div className="p-6 md:p-8 flex flex-col flex-grow">
              <div className="mb-4">
                <span className="block text-[#196659] text-xs font-bold uppercase tracking-widest mb-1">
                  {member.title}
                </span>
                <h2 className="text-2xl font-bold text-[#101918] dark:text-white leading-tight">
                  {member.name}
                </h2>
              </div>
              
              <p className="text-[#57606a] dark:text-[#a0aeb2] text-sm leading-relaxed mb-8 flex-grow line-clamp-3">
                {member.role}
              </p>
              
              <div className="pt-6 border-t border-[#f0f2f4] dark:border-[#2a3836] flex items-center justify-between mt-auto">
                <a
                  href={`/leadership/${member.id}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#101918] dark:text-white hover:text-[#196659] transition-colors"
                >
                  Read Full Bio
                  <svg className="w-[18px] h-[18px] transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
                
                {member.linkedinUrl && (
                  <a
                    href={member.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn Profile"
                    className="text-[#57606a] dark:text-[#a0aeb2] hover:text-[#0077b5] transition-colors"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  )
}
