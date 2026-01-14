'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { FaHandshake, FaUsers, FaLightbulb, FaArrowRight, FaCalendar, FaMapMarkerAlt } from 'react-icons/fa'

import { HeroCarousel } from '@/components/HeroCarousel'

export default function Home() {
  const activityImages = [
    { src: '/53cde13b1a312d32c08a429715695a65.jpg', alt: 'Activity 1' },
    { src: '/b220fe440206d474a74b2a2467d410ac.jpg', alt: 'Activity 2' },
    { src: '/ce9ea973f79cb6988ad3e2945e3a87ae.jpg', alt: 'Activity 3' },
    { src: '/f16b74a04b626f30222c37c4d15d7c80.jpg', alt: 'Activity 4' },
  ]

  const stats = [
    { label: 'Active Members', value: '50+' },
    { label: 'Service Projects', value: '25+' },
    { label: 'Community Impact', value: '1000+' },
  ]

  const pillars = [
    {
      icon: <FaHandshake className="text-5xl" />,
      title: 'Service',
      description:
        'Making a meaningful difference in our communities through impactful service projects that address real-world challenges and create lasting positive change.',
    },
    {
      icon: <FaLightbulb className="text-5xl" />,
      title: 'Professional Development',
      description:
        'Expanding your skills and network through leadership opportunities, workshops, and mentorship designed to accelerate your professional growth.',
    },
    {
      icon: <FaUsers className="text-5xl" />,
      title: 'Fellowship',
      description:
        'Building lasting connections with like-minded young professionals and becoming part of a global network committed to positive impact.',
    },
  ]

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image Carousel */}
        <div className="absolute inset-0 z-0">
          <HeroCarousel images={activityImages} variant="background" />
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70 z-10" />

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative z-20 container mx-auto px-4 text-center text-white py-32"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            the Rotaract Club of
            <br />
            <span className="bg-gradient-to-r from-rotaract-pink to-pink-400 bg-clip-text text-transparent">
              New York at the United Nations
            </span>
          </h1>
          <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed text-gray-200">
            Empowering young professionals to create positive change through service, professional
            development, and global fellowship in the heart of New York City.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link
              href="/membership-requirements"
              className="px-10 py-5 bg-rotaract-pink text-white font-bold text-lg rounded-full hover:bg-rotaract-darkpink transition-all shadow-lg hover:shadow-2xl transform hover:scale-105"
            >
              Join Our Community
            </Link>
            <Link
              href="/events"
              className="px-10 py-5 bg-white/10 backdrop-blur-sm text-white font-bold text-lg rounded-full border-2 border-white/50 hover:bg-white hover:text-rotaract-pink transition-all"
            >
              Explore Events
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.5 }}
                className="text-center"
              >
                <div className="text-5xl md:text-6xl font-bold text-rotaract-pink mb-3">
                  {stat.value}
                </div>
                <div className="text-lg text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Our Three Pillars</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Built on three core values that guide everything we do
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pillars.map((pillar, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                className="bg-white p-10 rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2"
              >
                <div className="text-rotaract-pink mb-6">{pillar.icon}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{pillar.title}</h3>
                <p className="text-gray-600 leading-relaxed">{pillar.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Activities Gallery Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Recent Activities</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              See what we&apos;ve been up to in our community
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {activityImages.map((img, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="relative group overflow-hidden rounded-2xl shadow-lg aspect-square"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-rotaract-pink/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <p className="text-white font-semibold text-lg">View Gallery</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 px-8 py-4 bg-rotaract-pink text-white font-bold text-lg rounded-full hover:bg-rotaract-darkpink transition-all shadow-lg hover:shadow-xl"
            >
              View Full Gallery
              <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-rotaract-pink to-rotaract-darkpink">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Ready to Make a Difference?
            </h2>
            <p className="text-xl md:text-2xl mb-10 text-white/90 leading-relaxed">
              Join us for our general meetings every 2nd and 4th Thursday and become part of a community 
              dedicated to creating positive change.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                href="/membership-requirements"
                className="inline-flex items-center gap-3 px-10 py-5 bg-white text-rotaract-pink font-bold text-lg rounded-full hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                Become a Member
                <FaArrowRight />
              </Link>
              <Link
                href="/meetings"
                className="px-10 py-5 bg-white/10 backdrop-blur-sm text-white font-bold text-lg rounded-full border-2 border-white/50 hover:bg-white hover:text-rotaract-pink transition-all"
              >
                <FaCalendar className="inline mr-2" />
                View Meeting Details
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Location Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-12"
          >
            <div className="flex items-center justify-center mb-8">
              <FaMapMarkerAlt className="text-5xl text-rotaract-pink" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">Visit Us</h2>
            <div className="text-center text-lg text-gray-700 space-y-3">
              <p className="font-bold text-2xl text-rotaract-pink">216 East 45th Street</p>
              <p className="text-xl font-medium">New York, NY 10017</p>
              <p className="text-xl font-medium">United States</p>
              <div className="pt-6 mt-6 border-t border-gray-200">
                <p className="text-gray-600">
                  Email:{' '}
                  <a
                    href="mailto:rotaractnewyorkcity@gmail.com"
                    className="text-rotaract-pink hover:text-rotaract-darkpink font-semibold hover:underline transition-colors"
                  >
                    rotaractnewyorkcity@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
