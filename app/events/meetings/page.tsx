'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function MeetingsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-background-dark">
      {/* Premium Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary-800"></div>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.4\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }}></div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-6">
              <span className="material-symbols-outlined text-accent text-sm">event</span>
              <span className="text-white/90 text-sm font-semibold">Open to All</span>
            </span>
            <h1 className="text-4xl md:text-6xl font-black mb-6 text-white tracking-tight">General Meetings</h1>
            <p className="text-xl text-white/80 leading-relaxed">
              Join us for fellowship, learning, and planning. Our meetings are open to Rotaractors, Rotarians, and anyone who supports our mission.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Quick Info Bar */}
      <section className="bg-gray-50 dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 py-6">
            {[
              { icon: 'schedule', label: '2nd & 4th Thursday', sublabel: '7:00 PM EST' },
              { icon: 'location_on', label: '216 E 45th St', sublabel: 'New York, NY' },
              { icon: 'video_call', label: 'Hybrid Format', sublabel: 'In-person + Zoom' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">{item.icon}</span>
                </div>
                <div>
                  <div className="font-bold text-gray-900 dark:text-white">{item.label}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{item.sublabel}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            
            {/* What to Expect */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white text-center">What to Expect</h2>
              <div className="grid md:grid-cols-4 gap-6">
                {[
                  { icon: 'campaign', title: 'Club Updates', desc: 'Announcements and news' },
                  { icon: 'groups', title: 'Committee Reports', desc: 'Project progress updates' },
                  { icon: 'mic', title: 'Guest Speakers', desc: 'Industry experts & leaders' },
                  { icon: 'handshake', title: 'Networking', desc: 'Connect with members' },
                ].map((item, i) => (
                  <div key={i} className="bg-gray-50 dark:bg-surface-dark p-6 rounded-2xl text-center group hover:shadow-lg transition-all">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary group-hover:scale-110 transition-all">
                      <span className="material-symbols-outlined text-primary text-2xl group-hover:text-white">{item.icon}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Meeting Types */}
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-surface-dark p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-zinc-700"
              >
                <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-white text-2xl">business_center</span>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">General Meetings</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  Our primary meetings where we discuss club business, vote on initiatives, and plan upcoming events.
                </p>
                <ul className="space-y-3">
                  {['Club announcements', 'Committee reports', 'Guest speakers', 'Networking time'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                      <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-surface-dark p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-zinc-700"
              >
                <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-white text-2xl">celebration</span>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Social Meetings</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  Casual gatherings focused on fellowship and building relationships among members.
                </p>
                <ul className="space-y-3">
                  {['Networking activities', 'Team building', 'Casual conversations', 'Fun and games'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                      <span className="material-symbols-outlined text-accent text-lg">check_circle</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

            {/* Past Topics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gray-50 dark:bg-zinc-900 p-8 md:p-12 rounded-3xl mb-16"
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Past Meeting Topics</h3>
                <p className="text-gray-600 dark:text-gray-400">We&apos;ve hosted engaging discussions on important topics</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  'Climate Change & Carbon Fee and Dividend',
                  'Combat Social Isolation for Elderly New Yorkers',
                  'The Impulso Project - Guatemala',
                  'UpwardlyGlobal Volunteer Program',
                  'The Henry Street Settlement Story',
                  'Reducing Inequalities with UN Representatives',
                  'Back to School Challenges & Education Equity',
                  'Community Service Initiatives',
                ].map((topic, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-white dark:bg-surface-dark rounded-xl">
                    <span className="material-symbols-outlined text-primary">radio_button_checked</span>
                    <span className="text-gray-700 dark:text-gray-300">{topic}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* First Time Visitors */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative overflow-hidden bg-gradient-to-br from-primary/5 to-accent/5 p-8 md:p-12 rounded-3xl border border-primary/10"
            >
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-5xl">waving_hand</span>
                </div>
                <div className="text-center md:text-left flex-grow">
                  <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">First Time Visitors Welcome!</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                    Interested in learning more? You&apos;re welcome to attend as our guest—no RSVP required. Just show up and introduce yourself!
                  </p>
                  <a
                    href="mailto:rotaractnewyorkcity@gmail.com"
                    className="inline-flex items-center gap-2 text-primary font-semibold hover:text-primary-600 transition-colors"
                  >
                    <span className="material-symbols-outlined">mail</span>
                    rotaractnewyorkcity@gmail.com
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.4\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }}></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-black mb-6 text-white">Ready to Join Us?</h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Become a member and be part of our vibrant community
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/membership-requirements"
              className="h-14 px-8 bg-white text-primary font-bold rounded-full transition-all shadow-xl flex items-center justify-center gap-2 hover:bg-accent hover:text-white hover:scale-105"
            >
              <span className="material-symbols-outlined">badge</span>
              Learn About Membership
            </Link>
            <Link
              href="/events"
              className="h-14 px-8 bg-transparent border-2 border-white/40 text-white font-bold rounded-full transition-all flex items-center justify-center gap-2 hover:bg-white/10"
            >
              <span className="material-symbols-outlined">calendar_today</span>
              See All Events
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
