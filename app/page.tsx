'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="bg-white dark:bg-background-dark">
      {/* Hero Section - Full viewport with premium styling */}
      <header className="relative w-full min-h-screen flex items-center justify-center overflow-hidden" role="banner">
        {/* Background Image with Premium Gradient Overlay */}
        <div className="absolute inset-0 z-0" aria-hidden="true">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/80 to-black/90 z-10"></div>
          <Image
            src="/53cde13b1a312d32c08a429715695a65.jpg"
            alt="Diverse group of young professionals collaborating"
            fill
            className="object-cover scale-105"
            priority
          />
        </div>
        
        {/* Decorative blurred elements */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-accent/20 rounded-full blur-3xl z-0" aria-hidden="true"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl z-0" aria-hidden="true"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative z-20 max-w-5xl px-6 text-center flex flex-col items-center"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-8"
          >
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
            <span className="text-white text-sm font-semibold tracking-wide">Rotary International Affiliate • Est. NYC</span>
          </motion.div>
          
          <h1 className="text-white text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.95] mb-8">
            Service
            <br />
            <span className="text-accent">Above Self</span>
          </h1>
          
          <p className="text-white/80 text-xl md:text-2xl font-medium max-w-2xl leading-relaxed mb-12">
            NYC&apos;s premier community for young professionals (18-30) building leadership through service and global fellowship.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/membership-requirements"
              className="group h-16 px-10 bg-white text-primary font-bold rounded-full transition-all shadow-2xl flex items-center justify-center gap-3 text-lg hover:bg-accent hover:text-white hover:scale-105"
            >
              Join Our Community
              <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
            <Link
              href="/events"
              className="h-16 px-8 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white font-bold rounded-full transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">calendar_today</span>
              View Events
            </Link>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20"
        >
          <div className="flex flex-col items-center gap-2 text-white/50">
            <span className="text-xs font-medium tracking-widest uppercase">Scroll</span>
            <motion.div 
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white/60"></div>
            </motion.div>
          </div>
        </motion.div>
      </header>

      {/* Mission & Stats Section - Unified premium design */}
      <section className="py-32 px-6 bg-white dark:bg-background-dark" id="main-content" aria-labelledby="mission-heading">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid lg:grid-cols-2 gap-16 items-center"
          >
            <div>
              <span className="text-primary text-sm font-bold uppercase tracking-widest mb-4 block">Our Purpose</span>
              <h2 id="mission-heading" className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white leading-tight mb-6">
                Empowering the next generation of{' '}
                <span className="text-primary">changemakers</span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
                We develop leadership skills, address community needs, and foster global understanding—all through a framework of friendship and meaningful service.
              </p>
              <div className="flex flex-wrap gap-4">
                {['Leadership Development', 'Community Impact', 'Global Network'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <span className="material-symbols-outlined text-primary">check_circle</span>
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-6">
              {[
                { value: '5,000+', label: 'Service Hours', icon: 'schedule', color: 'bg-primary' },
                { value: '120', label: 'Active Members', icon: 'groups', color: 'bg-accent' },
                { value: '$50K', label: 'Funds Raised', icon: 'volunteer_activism', color: 'bg-primary' },
                { value: '15', label: 'Global Partners', icon: 'public', color: 'bg-accent' },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="bg-gray-50 dark:bg-surface-dark p-8 rounded-2xl text-center group hover:shadow-xl transition-all"
                >
                  <div className={`w-14 h-14 ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    <span className="material-symbols-outlined text-white text-2xl">{stat.icon}</span>
                  </div>
                  <div className="text-4xl font-black text-gray-900 dark:text-white mb-1">{stat.value}</div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Three Pillars - Premium Card Design */}
      <section className="py-32 px-6 bg-gray-50 dark:bg-zinc-900">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <span className="text-primary text-sm font-bold uppercase tracking-widest mb-4 block">What We Do</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white">
              Three Pillars of Impact
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: 'volunteer_activism',
                title: 'Community Service',
                description: 'Hands-on projects making tangible impact across NYC—from food drives to park cleanups.',
                features: ['Monthly volunteer events', 'Local nonprofit partnerships', 'Fundraising initiatives'],
                color: 'primary',
                image: '/ce9ea973f79cb6988ad3e2945e3a87ae.jpg'
              },
              {
                icon: 'school',
                title: 'Professional Growth',
                description: 'Develop leadership skills and expand your network with industry professionals.',
                features: ['Guest speaker series', 'Leadership workshops', 'Mentorship programs'],
                color: 'accent',
                image: '/b220fe440206d474a74b2a2467d410ac.jpg'
              },
              {
                icon: 'public',
                title: 'Global Fellowship',
                description: 'Connect with 1.2M+ Rotaractors worldwide and build lifelong friendships.',
                features: ['International conventions', 'Cultural exchanges', 'Global projects'],
                color: 'primary',
                image: '/f16b74a04b626f30222c37c4d15d7c80.jpg'
              },
            ].map((pillar, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.6 }}
                className="group bg-white dark:bg-surface-dark rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500"
              >
                <div className="relative h-56 overflow-hidden">
                  <Image
                    src={pillar.image}
                    alt={pillar.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className={`absolute bottom-4 left-4 w-14 h-14 ${pillar.color === 'primary' ? 'bg-primary' : 'bg-accent'} rounded-xl flex items-center justify-center`}>
                    <span className="material-symbols-outlined text-white text-2xl">{pillar.icon}</span>
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{pillar.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">{pillar.description}</p>
                  <ul className="space-y-3">
                    {pillar.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <span className={`material-symbols-outlined text-lg ${pillar.color === 'primary' ? 'text-primary' : 'text-accent'}`}>check_circle</span>
                        <span className="text-sm font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-32 px-6 bg-white dark:bg-background-dark">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-7xl text-primary/20 font-serif leading-none">&ldquo;</span>
            <blockquote className="text-2xl md:text-3xl font-medium text-gray-800 dark:text-gray-100 leading-relaxed mb-8 -mt-4">
              Joining Rotaract NYC was the best decision I made after moving to the city. I found my community, developed real leadership skills, and made friendships that will last a lifetime.
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">S</span>
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-900 dark:text-white">Sarah J.</div>
                <div className="text-gray-500 dark:text-gray-400">Member since 2019</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section - Premium finish */}
      <section className="relative py-32 px-6 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary-800"></div>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.4\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }}></div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10 max-w-4xl mx-auto text-center"
        >
          <span className="material-symbols-outlined text-white/20 text-8xl mb-6 block">diversity_3</span>
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
            Ready to make<br />a difference?
          </h2>
          <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join us at our next meeting—no commitment required. Meet our members, learn about projects, and see if Rotaract is right for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/meetings"
              className="group h-16 px-10 bg-white text-primary font-bold rounded-full transition-all shadow-2xl flex items-center justify-center gap-3 text-lg hover:bg-accent hover:text-white hover:scale-105"
            >
              <span className="material-symbols-outlined">event</span>
              Attend a Meeting
            </Link>
            <Link
              href="/contact"
              className="h-16 px-8 bg-transparent border-2 border-white/40 text-white font-bold rounded-full transition-all flex items-center justify-center gap-2 hover:bg-white/10"
            >
              <span className="material-symbols-outlined">mail</span>
              Get in Touch
            </Link>
          </div>
          
          {/* Quick info */}
          <div className="mt-16 pt-12 border-t border-white/20 flex flex-wrap justify-center gap-8 text-white/70">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">schedule</span>
              <span>Every 2nd & 4th Thursday</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">location_on</span>
              <span>216 E 45th St, NYC</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">groups</span>
              <span>Ages 18-30</span>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
