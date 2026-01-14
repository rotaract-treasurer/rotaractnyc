'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { FaHandshake, FaUsers, FaBalanceScale } from 'react-icons/fa'
import { MdDiversity3 } from 'react-icons/md'

export default function MissionPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Split Hero Section */}
      <section className="relative w-full min-h-[85vh] grid grid-cols-1 lg:grid-cols-2">
        {/* Left: Text Content */}
        <div className="relative bg-primary dark:bg-primary-dark flex flex-col justify-center px-8 py-20 lg:px-20 order-2 lg:order-1">
          <div className="max-w-xl mx-auto lg:mx-0 flex flex-col gap-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-white/10 w-fit border border-white/20">
              <span className="material-symbols-outlined text-white text-sm">verified</span>
              <span className="text-xs font-bold text-white uppercase tracking-wider">Mission Statement</span>
            </div>
            <blockquote className="relative">
              <span className="absolute -top-6 -left-4 text-6xl text-accent/20 font-serif">&ldquo;</span>
              <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight">
                Service Above Self is more than a motto; it&apos;s our <span className="text-accent underline decoration-4 underline-offset-4 decoration-white/20">daily practice</span>.
              </h1>
            </blockquote>
            <div className="flex items-center gap-4 mt-4">
              <div className="h-px w-12 bg-white/30"></div>
              <h2 className="text-white/80 text-base font-medium">– Sarah J., Member since 2019</h2>
            </div>
            <div className="pt-8">
              <Link href="/events" className="group inline-flex items-center gap-3 bg-white text-primary px-8 py-4 rounded font-bold text-lg hover:bg-accent hover:text-primary transition-all duration-300 shadow-xl shadow-black/10">
                See Our Impact
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </Link>
            </div>
          </div>
          {/* Abstract texture overlay */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')"}}></div>
        </div>
        
        {/* Right: Image */}
        <div className="relative h-[50vh] lg:h-auto bg-gray-200 dark:bg-gray-800 order-1 lg:order-2 overflow-hidden group">
          <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB9awVNiLaVmUqHKESkhm_Mal48Izh9HDIz2i5w4G_uMV7HqAoLdHj7D_IPq1ziqZiolaP1OxJ5ceeHwj1OQdAm57V6quvDPOorbqDq0czwRLt4gA3hzsFl0OPR0f_GcmK_zdvqWjuCinqfaWolj5KEUqrgmTJEqubwlgXyIjOK2k78n9E0C5XgurNRfq-pB4LU9-qqY2hOpqd-z___AbcLV7EVLin9FQPiklmpQ3YZIk-cup-Cx_GMBz-_LlpipAVzN5DZTvOc6Mw')"}}></div>
          <div className="absolute inset-0 bg-primary/20 dark:bg-primary-dark/20 mix-blend-multiply"></div>
        </div>
      </section>

      {/* Impact Stats Strip */}
      <section className="relative bg-white dark:bg-slate-800 -mt-8 mx-4 lg:mx-20 rounded-lg shadow-lg z-10 border border-slate-100 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-700">
            
            {/* Service */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-lg shadow-md"
            >
              <FaHandshake className="text-5xl text-rotaract-pink mb-4" />
              <h3 className="text-2xl font-bold mb-4 text-rotaract-darkpink">Service</h3>
              <p className="text-gray-700">
                Our club strives to make a positive impact on the community in which we live. We have a strong partnership with our local Rotary Clubs and our core mission is reducing inequalities. We are always looking to expand our network to increase our positive influence on the community.
              </p>
            </motion.div>

            {/* Fellowship */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white p-8 rounded-lg shadow-md"
            >
              <FaUsers className="text-5xl text-rotaract-pink mb-4" />
              <h3 className="text-2xl font-bold mb-4 text-rotaract-darkpink">Fellowship</h3>
              <p className="text-gray-700">
                New York City is a big place. Our club provides our members with close-knit support and the opportunity to make life-long friendships. Our social events allow our members to explore the City with like-minded people, whether they have been here all their lives or just arrived last week!
              </p>
            </motion.div>

            {/* Diversity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white p-8 rounded-lg shadow-md"
            >
              <MdDiversity3 className="text-5xl text-rotaract-pink mb-4" />
              <h3 className="text-2xl font-bold mb-4 text-rotaract-darkpink">Diversity</h3>
              <p className="text-gray-700">
                We celebrate diversity. Our membership consists of young men and women from all over the World. We welcome anyone and everyone as long as they are also committed to Rotaract&apos;s goals. The different perspectives and experiences that our members bring to each of our events is the hallmark of our club.
              </p>
            </motion.div>

            {/* Equity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-white p-8 rounded-lg shadow-md"
            >
              <FaBalanceScale className="text-5xl text-rotaract-pink mb-4" />
              <h3 className="text-2xl font-bold mb-4 text-rotaract-darkpink">Equity</h3>
              <p className="text-gray-700">
                We believe in the dignity and humanity of all people and envision a world where society and its systems are just, inclusive and enable anyone to reach their full potential. We strive for a healthy and prosperous society that promotes all people having equitable access and opportunity.
              </p>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Rotaract Is Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-6 text-rotaract-darkpink">Rotaract is...</h2>
              <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                <p>
                  ...a Rotary-sponsored service club for young men and women ages 18 to 35. Rotaract brings together dedicated individuals to take action in their communities, develop their leadership and professional skills, and have fun. Rotaract clubs are either community or university based. We are true &quot;partners in service&quot; and key members of the family of Rotary. As one of Rotary&apos;s most significant and fastest-growing service programs, with more than 8,000 clubs in about 167 countries and geographical areas, Rotaract has become a worldwide phenomenon.
                </p>
                <p>
                  All Rotaract efforts begin at the local, grassroots level, with members addressing their communities and spreading to the global scale.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Rotary Is Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-6 text-rotaract-darkpink">Rotary is...</h2>
              <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                <p>
                  ...an international community consisting of 1.2 million neighbors, friends, and community leaders who come together to create positive, lasting change locally and globally. Differing occupations, cultures, and countries give Rotary members a unique perspective. Most importantly, the shared passion for service helps us accomplish the remarkable.
                </p>
                <p>
                  For more information on Rotary and Rotaract, please visit{' '}
                  <a 
                    href="https://www.rotary.org" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-rotaract-pink hover:text-rotaract-darkpink font-semibold underline"
                  >
                    Rotary.org
                  </a>.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-6 text-rotaract-darkpink">Join Us Today</h2>
            <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
              Become part of our diverse community of young professionals making a difference in New York City
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/about/membership"
                className="px-8 py-3 bg-rotaract-pink text-white rounded-full font-semibold hover:bg-rotaract-darkpink transition-colors"
              >
                Learn About Membership
              </Link>
              <Link
                href="/contact"
                className="px-8 py-3 border-2 border-rotaract-pink text-rotaract-darkpink rounded-full font-semibold hover:bg-rotaract-pink hover:text-white transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
