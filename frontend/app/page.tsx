'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function HomePage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/services?search=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      router.push('/services')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-12 text-white overflow-hidden">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/KoiHire Header.mp4" type="video/mp4" />
        </video>

        {/* Overlay to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-koi-navy/80 via-koi-navy/70 to-koi-navy/80"></div>

        {/* Content */}
        <div className="container mx-auto px-5 relative z-10">
          <div className="max-w-6xl mx-auto">
            {/* Main Heading */}
            <div className="text-center mb-8 animate-fade-in-up">
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-3">
                Find Talent or <span className="gradient-koi-text">Post Your Project</span>
              </h1>
              <p className="text-lg text-gray-300">
                Browse services or let freelancers compete for your custom project
              </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-3xl mx-auto mb-8 animate-fade-in-up">
              <div className="bg-white rounded-xl p-1.5 shadow-xl flex gap-2">
                <div className="relative flex-1">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Search for services... (e.g., 'logo design', 'web development')"
                    className="w-full pl-10 pr-3 py-3 text-gray-900 rounded-lg focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="bg-koi-orange hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search
                </button>
              </div>
              <p className="text-center text-gray-400 text-xs mt-2">
                Popular: <span className="text-koi-gold cursor-pointer hover:underline" onClick={() => { setSearchQuery('logo design'); }}>Logo Design</span>, <span className="text-koi-gold cursor-pointer hover:underline" onClick={() => { setSearchQuery('web development'); }}>Web Development</span>, <span className="text-koi-gold cursor-pointer hover:underline" onClick={() => { setSearchQuery('content writing'); }}>Content Writing</span>
              </p>
            </div>

            {/* Two Paths - Compact */}
            <div className="grid lg:grid-cols-2 gap-6 max-w-4xl mx-auto animate-fade-in-up">
              {/* Path 1: Browse Services */}
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-koi-teal/30 hover:border-koi-teal transition-all">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 bg-koi-teal rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">Browse Freelancer Services</h3>
                    <p className="text-gray-400 text-sm">Ready-made services with fixed prices</p>
                  </div>
                </div>
                <Link href="/services" className="block w-full text-center bg-koi-teal hover:bg-teal-600 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors text-sm">
                  Browse All Services →
                </Link>
              </div>

              {/* Path 2: Post a Project */}
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-koi-orange/30 hover:border-koi-orange transition-all">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 bg-koi-orange rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">Post a Project</h3>
                    <p className="text-gray-400 text-sm">Get competitive bids from freelancers</p>
                  </div>
                </div>
                <Link href="/register" className="block w-full text-center bg-koi-orange hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors text-sm">
                  Post a Project →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Let Our Freelancers Help */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-5">
          <div className="text-center mb-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-koi-navy mb-3">Let Our Freelancers Help</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Skilled professionals ready to bring your vision to life across every category.</p>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Link href="/services?category=web-development" className="card-modern text-center hover:border-koi-orange cursor-pointer transition-all duration-300" style={{ padding: '1.25rem' }}>
              <div className="w-10 h-10 bg-koi-orange icon-modern mx-auto mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="font-semibold text-koi-navy text-sm">Web Development</h4>
            </Link>
            <Link href="/services?category=mobile-development" className="card-modern text-center hover:border-koi-teal cursor-pointer transition-all duration-300" style={{ padding: '1.25rem' }}>
              <div className="w-10 h-10 bg-koi-teal icon-modern mx-auto mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="font-semibold text-koi-navy text-sm">Mobile Apps</h4>
            </Link>
            <Link href="/services?category=design-creative" className="card-modern text-center hover:border-yellow-500 cursor-pointer transition-all duration-300" style={{ padding: '1.25rem' }}>
              <div className="w-10 h-10 bg-yellow-500 icon-modern mx-auto mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
              </div>
              <h4 className="font-semibold text-koi-navy text-sm">Design & Creative</h4>
            </Link>
            <Link href="/services?category=writing-translation" className="card-modern text-center hover:border-koi-gold cursor-pointer transition-all duration-300" style={{ padding: '1.25rem' }}>
              <div className="w-10 h-10 bg-koi-gold icon-modern mx-auto mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <h4 className="font-semibold text-koi-navy text-sm">Writing & Translation</h4>
            </Link>
            <Link href="/services?category=marketing-seo" className="card-modern text-center hover:border-red-500 cursor-pointer transition-all duration-300" style={{ padding: '1.25rem' }}>
              <div className="w-10 h-10 bg-red-500 icon-modern mx-auto mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h4 className="font-semibold text-koi-navy text-sm">Marketing & SEO</h4>
            </Link>
            <Link href="/services?category=data-analytics" className="card-modern text-center hover:border-koi-teal cursor-pointer transition-all duration-300" style={{ padding: '1.25rem' }}>
              <div className="w-10 h-10 bg-koi-teal icon-modern mx-auto mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="font-semibold text-koi-navy text-sm">Data & Analytics</h4>
            </Link>
          </div>
        </div>
      </section>

      {/* Stuck Building Your MVP Section */}
      <section className="section-spacing bg-gray-50">
        <div className="container mx-auto px-5">
          <div className="max-w-6xl mx-auto bg-gradient-to-r from-purple-600 to-purple-700 rounded-3xl p-8 lg:p-12 text-white shadow-2xl relative overflow-hidden">
            {/* Decorative background elements for depth */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full opacity-20 blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-800 rounded-full opacity-20 blur-3xl translate-y-1/2 -translate-x-1/2"></div>

            <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
            <div className="animate-fade-in-up">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                Stuck Building Your MVP?
              </h2>
              <p className="text-xl mb-8 opacity-90 leading-relaxed">
                Get matched with the right expert to turn your prototype into a real, working product. From idea to launch, find developers who speak startup.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link
                  href="/register"
                  className="px-8 py-4 rounded-lg font-semibold transition-all text-center shadow-lg hover:shadow-xl hover:scale-105 transform"
                  style={{
                    backgroundColor: 'white',
                    color: '#7C3AED'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#FEF3C7'
                    e.currentTarget.style.color = '#7C3AED'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white'
                    e.currentTarget.style.color = '#7C3AED'
                  }}
                >
                  Find an Expert
                </Link>
                <Link
                  href="/services"
                  className="px-8 py-4 rounded-lg font-semibold transition-all text-center shadow-lg hover:shadow-xl hover:scale-105 transform"
                  style={{
                    border: '2px solid white',
                    backgroundColor: 'transparent',
                    color: 'white'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'white'
                    e.currentTarget.style.color = '#7C3AED'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = 'white'
                  }}
                >
                  Browse Services
                </Link>
              </div>
              <div className="flex flex-wrap gap-6 text-sm opacity-75">
                <span>✨ MVP-focused developers</span>
                <span>⚡ Quick turnaround</span>
                <span>💡 Startup-friendly pricing</span>
              </div>
            </div>
            
            {/* Mockup/Illustration */}
            <div className="relative animate-fade-in-up">
              {/* Layered shadow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl blur-xl opacity-50 translate-x-2 translate-y-2"></div>

              <div className="relative bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 border border-white border-opacity-20 shadow-xl">
                <div className="space-y-4">
                  {/* Mock coding interface */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <span className="text-2xl">👨‍💻</span>
                    </div>
                    <div>
                      <div className="font-semibold">Expert Developer</div>
                      <div className="text-sm opacity-75">React • Node.js • AWS</div>
                    </div>
                  </div>
                  
                  {/* Mock code snippet */}
                  <div className="relative">
                    {/* Code block shadow layer */}
                    <div className="absolute inset-0 bg-black rounded-lg opacity-40 blur-md translate-y-1"></div>

                    <div className="relative bg-gray-900 rounded-lg p-4 text-left font-mono text-sm shadow-lg border border-gray-800">
                      <div className="text-green-400">// Building your MVP</div>
                      <div className="text-blue-300">const <span className="text-yellow-300">mvp</span> = {`{`}</div>
                      <div className="text-white ml-4">idea: <span className="text-green-300">'Your Vision'</span>,</div>
                      <div className="text-white ml-4">timeline: <span className="text-green-300">'2-4 weeks'</span>,</div>
                      <div className="text-white ml-4">budget: <span className="text-green-300">'startup-friendly'</span></div>
                      <div className="text-blue-300">{`}`}</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-white border-opacity-20">
                    <span className="text-sm">✅ Ready to deploy</span>
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                      Delivered
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* How It Works - Dual Marketplace */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-5">
          {/* Shared Security Section - Moved to Top */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="bg-white rounded-2xl p-6 text-center shadow-lg border border-gray-200">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="w-12 h-12 bg-koi-gold rounded-xl flex items-center justify-center shadow-md">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-koi-navy">Secure Payment & Delivery</h3>
              </div>
              <p className="text-gray-600 max-w-2xl mx-auto mb-4">
                No matter which path you choose, your payment is protected in escrow. Funds are only released when you're satisfied with the work.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <svg className="w-5 h-5 text-koi-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Escrow Protection</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <svg className="w-5 h-5 text-koi-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Milestone Tracking</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <svg className="w-5 h-5 text-koi-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Dispute Resolution</span>
                </div>
              </div>
            </div>
          </div>

          {/* Two Paths */}
          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Path 1: Browse Services */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-transparent hover:border-koi-orange transition-all">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-koi-orange rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-koi-navy">Browse Services</h3>
                  <p className="text-sm text-koi-orange font-semibold">Quick & Easy</p>
                </div>
              </div>

              <div className="space-y-2.5 mb-6">
                <div className="flex items-start gap-2.5">
                  <svg className="w-5 h-5 text-koi-orange flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-600 text-sm">Find ready-made services with clear pricing and delivery times</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <svg className="w-5 h-5 text-koi-orange flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-600 text-sm">Review freelancer portfolios, ratings, and past work</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <svg className="w-5 h-5 text-koi-orange flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-600 text-sm">Order instantly and get started right away</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Best for:</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-orange-50 text-koi-orange text-xs rounded-full">Defined needs</span>
                  <span className="px-3 py-1 bg-orange-50 text-koi-orange text-xs rounded-full">Quick turnaround</span>
                  <span className="px-3 py-1 bg-orange-50 text-koi-orange text-xs rounded-full">Fixed budget</span>
                </div>
              </div>
            </div>

            {/* Path 2: Post a Project */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-transparent hover:border-koi-teal transition-all">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-koi-teal rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-koi-navy">Post a Project</h3>
                  <p className="text-sm text-koi-teal font-semibold">Custom Solutions</p>
                </div>
              </div>

              <div className="space-y-2.5 mb-6">
                <div className="flex items-start gap-2.5">
                  <svg className="w-5 h-5 text-koi-teal flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-600 text-sm">Describe your project with requirements, budget, and timeline</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <svg className="w-5 h-5 text-koi-teal flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-600 text-sm">Receive competitive proposals from interested freelancers</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <svg className="w-5 h-5 text-koi-teal flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-600 text-sm">Compare bids and choose the perfect expert for your needs</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Best for:</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-teal-50 text-koi-teal text-xs rounded-full">Custom work</span>
                  <span className="px-3 py-1 bg-teal-50 text-koi-teal text-xs rounded-full">Complex projects</span>
                  <span className="px-3 py-1 bg-teal-50 text-koi-teal text-xs rounded-full">Flexible scope</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose KoiHire */}
      <section className="section-spacing bg-white">
        <div className="container-spacing">
          <h2 className="heading-secondary text-koi-navy text-center mb-section">Why Choose KoiHire?</h2>
          <div className="grid lg:grid-cols-2 gap-section items-start">
            <div className="space-y-8">
              <div className="flex gap-6 animate-fade-in-up">
                <div className="w-12 h-12 bg-koi-orange icon-modern flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="heading-tertiary text-koi-navy">Better Matching</h4>
                  <p className="text-spacing-relaxed text-gray-600">Freelancers bid on projects they're genuinely excited about, leading to higher quality work and better outcomes.</p>
                </div>
              </div>

              <div className="flex gap-6 animate-fade-in-up">
                <div className="w-12 h-12 bg-koi-teal icon-modern flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="heading-tertiary text-koi-navy">Save Time</h4>
                  <p className="text-spacing-relaxed text-gray-600">No more browsing hundreds of profiles. Post once and let qualified freelancers come to you with tailored proposals.</p>
                </div>
              </div>

              <div className="flex gap-6 animate-fade-in-up">
                <div className="w-12 h-12 bg-koi-gold icon-modern flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h4 className="heading-tertiary text-koi-navy">Secure Payments</h4>
                  <p className="text-spacing-relaxed text-gray-600">Built-in escrow system protects both parties. Funds are released as milestones are completed to everyone's satisfaction.</p>
                </div>
              </div>

              <div className="flex gap-6 animate-fade-in-up">
                <div className="w-12 h-12 bg-koi-orange icon-modern flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <h4 className="heading-tertiary text-koi-navy">Competitive Pricing</h4>
                  <p className="text-spacing-relaxed text-gray-600">Multiple bids create natural competition, ensuring you get the best value without compromising on quality.</p>
                </div>
              </div>
            </div>
            
            {/* Project Example */}
            <div className="card-modern">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="heading-tertiary text-koi-navy mb-2">Website Redesign Project</h4>
                  <p className="text-gray-600 text-sm mb-2">E-commerce site needs modern UI/UX overhaul</p>
                  <p className="text-gray-600 text-sm"><strong>Budget:</strong> $3,000-$5,000 • <strong>Timeline:</strong> 3-4 weeks</p>
                </div>
                <div className="bg-koi-teal/10 text-koi-teal px-3 py-1 rounded-full text-sm font-medium">Active</div>
              </div>

              <div className="text-gray-600 text-sm mb-6 p-4 bg-koi-cream rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="font-bold text-lg text-koi-navy">8</div>
                    <div className="text-xs">Total Bids</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg text-koi-navy">$4,200</div>
                    <div className="text-xs">Avg Bid</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg text-koi-navy">2 days</div>
                    <div className="text-xs">To Select</div>
                  </div>
                </div>
              </div>

              <div className="bg-koi-cream p-5 rounded-lg border-2 border-koi-orange/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 gradient-koi rounded-full flex items-center justify-center font-bold text-white">M</div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Maria Rodriguez</div>
                    <div className="text-gray-600 text-sm">UI/UX Designer • ⭐ 4.9</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-koi-orange">$4,200</div>
                    <div className="bg-koi-orange text-white px-3 py-1 rounded-full text-xs font-medium">Selected</div>
                  </div>
                </div>
              </div>

              <div className="bg-koi-teal/10 border border-koi-teal/30 rounded-lg p-4 mt-4 text-center text-koi-teal">
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">$4,200 secured in escrow</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-spacing bg-gradient-to-r from-koi-navy to-gray-800 text-white text-center">
        <div className="container-spacing">
          <div className="mb-10">
            <div className="w-16 h-16 gradient-koi icon-modern mx-auto mb-8">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <h2 className="heading-primary mb-6 text-center text-koi-navy">Ready to Start Your <span className="gradient-koi-text">Next Project?</span></h2>
          <p className="text-lead text-gray-300 mb-10 max-w-2xl mx-auto">Join thousands of businesses who've discovered a better way to work with freelancers. Post your project today and see the difference competitive bidding makes.</p>
          <Link href="/register" className="btn-koi-primary btn-large">
            Post Your First Project →
          </Link>
          <div className="text-gray-300 text-sm mt-5">
            No credit card required<br/>
            Free to post projects
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
            <div>
              <h4 className="text-2xl font-bold mb-2 text-koi-gold">2 min</h4>
              <p className="text-gray-300 text-sm">Project Setup</p>
            </div>
            <div>
              <h4 className="text-2xl font-bold mb-2 text-koi-gold">24 hrs</h4>
              <p className="text-gray-300 text-sm">First Bids</p>
            </div>
            <div>
              <h4 className="text-2xl font-bold mb-2 text-koi-gold">100%</h4>
              <p className="text-gray-300 text-sm">Secure</p>
            </div>
            <div>
              <h4 className="text-2xl font-bold mb-2 text-koi-gold">24/7</h4>
              <p className="text-gray-300 text-sm">Support</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}