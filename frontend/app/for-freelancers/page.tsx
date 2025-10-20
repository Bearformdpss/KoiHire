'use client'

import Link from 'next/link'

export default function ForFreelancersPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-koi-navy py-20 text-white">
        <div className="container mx-auto px-5">
          <div className="grid lg:grid-cols-2 gap-15 items-center">
            <div className="animate-fade-in-up">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-8">
                Find Work. <span className="text-koi-teal">Bid Smart.</span> <span className="text-koi-gold">Get Paid.</span>
              </h1>
              <p className="text-xl text-gray-300 mb-10 leading-relaxed">
                Stop chasing clients. Browse exciting projects, submit proposals that showcase your expertise, and win work on your terms. Build your reputation and earn more.
              </p>
              <div className="flex gap-5 mb-10">
                <Link href="/register" className="btn-koi-primary btn-large">
                  Join as Freelancer →
                </Link>
                <Link href="/marketplace" className="btn-koi-secondary btn-large">
                  Browse Projects
                </Link>
              </div>
              <div className="flex gap-10">
                <div className="flex items-center gap-3 text-gray-300">
                  <span className="text-koi-teal">✓</span>
                  Free to Join
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <span className="text-koi-teal">✓</span>
                  Secure Payments
                </div>
              </div>
            </div>

            {/* Freelancer Earnings Card */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 text-white hover-lift border border-koi-teal/30">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Your Monthly Earnings</div>
                  <div className="text-4xl font-bold text-koi-gold mb-1">$8,450</div>
                  <div className="text-sm text-green-400">↑ 23% from last month</div>
                </div>
                <div className="bg-koi-teal/20 text-koi-teal px-3 py-1 rounded-full text-sm font-medium">
                  Active
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between p-3 bg-koi-navy/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      💻
                    </div>
                    <div>
                      <div className="font-semibold text-sm">E-commerce Site</div>
                      <div className="text-xs text-gray-400">In Progress</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-koi-orange font-bold">$3,200</div>
                    <div className="text-xs text-gray-400">75% complete</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-koi-navy/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      🎨
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Brand Redesign</div>
                      <div className="text-xs text-gray-400">In Progress</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-koi-teal font-bold">$2,500</div>
                    <div className="text-xs text-gray-400">40% complete</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-koi-navy/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      📱
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Mobile App MVP</div>
                      <div className="text-xs text-green-400">Completed</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-koi-gold font-bold">$4,800</div>
                    <div className="text-xs text-gray-400">Paid</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-4 bg-gradient-to-r from-koi-orange/20 to-koi-teal/20 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold">12</div>
                  <div className="text-xs text-gray-400">Projects</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">4.9⭐</div>
                  <div className="text-xs text-gray-400">Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">98%</div>
                  <div className="text-xs text-gray-400">Success</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works for Freelancers */}
      <section className="section-spacing bg-white">
        <div className="container-spacing">
          <div className="text-center mb-section">
            <h2 className="heading-secondary text-koi-navy">How to Start Earning on KoiHire</h2>
            <p className="text-lead max-w-2xl mx-auto">Three simple steps to land your next project and grow your freelance career.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-section">
            <div className="text-center animate-fade-in-up">
              <div className="w-16 h-16 bg-koi-orange icon-modern mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="heading-tertiary text-koi-navy">Browse Projects</h3>
              <p className="text-spacing-relaxed text-gray-600">Explore projects that match your skills and interests. Filter by category, budget, and timeline to find the perfect fit for your expertise.</p>
            </div>
            <div className="text-center animate-fade-in-up">
              <div className="w-16 h-16 bg-koi-teal icon-modern mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="heading-tertiary text-koi-navy">Submit Proposals</h3>
              <p className="text-spacing-relaxed text-gray-600">Craft compelling proposals that highlight your approach, timeline, and competitive pricing. Stand out by showing clients exactly how you'll solve their problem.</p>
            </div>
            <div className="text-center animate-fade-in-up">
              <div className="w-16 h-16 bg-koi-gold icon-modern mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="heading-tertiary text-koi-navy">Deliver & Get Paid</h3>
              <p className="text-spacing-relaxed text-gray-600">Work directly with clients through our platform. Complete milestones, receive feedback, and get paid securely through escrow when the work is approved.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Freelancers Choose KoiHire */}
      <section className="section-spacing bg-gray-50">
        <div className="container-spacing">
          <h2 className="heading-secondary text-koi-navy text-center mb-section">Why Freelancers Love KoiHire</h2>
          <div className="grid lg:grid-cols-2 gap-section items-start">
            <div className="space-y-8">
              <div className="flex gap-6 animate-fade-in-up">
                <div className="w-12 h-12 bg-koi-orange icon-modern flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h4 className="heading-tertiary text-koi-navy">Quality Projects</h4>
                  <p className="text-spacing-relaxed text-gray-600">Access serious clients with real budgets. No tire-kickers or lowball offers—just professionals ready to invest in quality work.</p>
                </div>
              </div>

              <div className="flex gap-6 animate-fade-in-up">
                <div className="w-12 h-12 bg-koi-teal icon-modern flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h4 className="heading-tertiary text-koi-navy">Payment Protection</h4>
                  <p className="text-spacing-relaxed text-gray-600">Every project uses escrow to ensure you get paid for your work. Funds are secured before you start, released when milestones are approved.</p>
                </div>
              </div>

              <div className="flex gap-6 animate-fade-in-up">
                <div className="w-12 h-12 bg-koi-teal icon-modern flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="heading-tertiary text-koi-navy">Work Your Way</h4>
                  <p className="text-spacing-relaxed text-gray-600">Choose projects that fit your schedule and expertise. Set your own rates, propose your own timelines, and work on your terms.</p>
                </div>
              </div>

              <div className="flex gap-6 animate-fade-in-up">
                <div className="w-12 h-12 bg-koi-gold icon-modern flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <h4 className="heading-tertiary text-koi-navy">Build Your Reputation</h4>
                  <p className="text-spacing-relaxed text-gray-600">Earn reviews and ratings that showcase your expertise. Build a portfolio of successful projects and attract even better opportunities.</p>
                </div>
              </div>
            </div>

            {/* Freelancer Success Stats */}
            <div className="bg-white rounded-xl p-8 border hover-lift">
              <h4 className="text-xl font-bold text-koi-navy mb-6 text-center">Average Freelancer Success</h4>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">$4,200</div>
                  <div className="text-gray-600 text-sm">Avg. Monthly Earnings</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">8</div>
                  <div className="text-gray-600 text-sm">Projects per Month</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">92%</div>
                  <div className="text-gray-600 text-sm">Win Rate on Bids</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">4.8⭐</div>
                  <div className="text-gray-600 text-sm">Avg. Rating</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg text-center">
                <div className="text-sm font-medium text-gray-700">💰 Top freelancers earn $15k+ monthly on KoiHire</div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Payment Speed</span>
                  <span className="font-semibold text-green-600">Same Day</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Platform Fee</span>
                  <span className="font-semibold text-koi-navy">10-15%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Active Projects</span>
                  <span className="font-semibold text-blue-600">500+</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Multiple Ways to Earn */}
      <section className="section-spacing bg-white">
        <div className="container-spacing">
          <div className="text-center mb-section">
            <h2 className="heading-secondary text-koi-navy">Two Ways to Earn on KoiHire</h2>
            <p className="text-lead max-w-2xl mx-auto">Choose how you want to work—bid on custom projects or sell your services directly.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Project Bidding */}
            <div className="card-modern hover-lift">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 icon-modern mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="heading-tertiary text-koi-navy mb-3">Bid on Projects</h3>
                <p className="text-gray-600 mb-6">Browse client projects and submit custom proposals. Perfect for larger, unique projects where you can showcase your expertise.</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span>
                  Custom project scopes
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span>
                  Set your own price
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span>
                  Negotiate directly with clients
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span>
                  Build long-term relationships
                </div>
              </div>

              <Link href="/marketplace" className="btn-koi-primary w-full text-center block">
                Browse Projects
              </Link>
            </div>

            {/* Service Marketplace */}
            <div className="card-modern hover-lift">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-yellow-500 icon-modern mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h3 className="heading-tertiary text-koi-navy mb-3">Sell Your Services</h3>
                <p className="text-gray-600 mb-6">Create service packages with fixed pricing. Clients browse and buy directly—no bidding required. Like Fiverr, but better.</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span>
                  Fixed-price packages
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span>
                  Passive income stream
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span>
                  Quick setup & start earning
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span>
                  Reach more clients faster
                </div>
              </div>

              <Link
                href="/freelancer/services/create"
                className="group inline-block w-full text-center px-6 py-3 bg-transparent border-2 rounded-lg font-semibold transition-all duration-300"
                style={{
                  color: '#2A9D8F',
                  borderColor: '#2A9D8F'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2A9D8F'
                  e.currentTarget.style.color = 'white'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#2A9D8F'
                }}
              >
                Create a Service
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Skills in Demand */}
      <section className="section-spacing bg-white">
        <div className="container-spacing">
          <div className="text-center mb-section">
            <h2 className="heading-secondary text-koi-navy">Skills in High Demand</h2>
            <p className="text-lead max-w-2xl mx-auto">These are the most requested skills on KoiHire. Master these and watch your income soar.</p>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6">
            <div className="card-modern text-center hover:border-koi-orange transition-all duration-300">
              <div className="w-12 h-12 bg-koi-orange icon-modern mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="font-semibold text-koi-navy">Web Development</h4>
            </div>
            <div className="card-modern text-center hover:border-koi-teal transition-all duration-300">
              <div className="w-12 h-12 bg-koi-teal icon-modern mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="font-semibold text-koi-navy">Mobile Development</h4>
            </div>
            <div className="card-modern text-center hover:border-yellow-500 transition-all duration-300">
              <div className="w-12 h-12 bg-yellow-500 icon-modern mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
              </div>
              <h4 className="font-semibold text-koi-navy">UI/UX Design</h4>
            </div>
            <div className="card-modern text-center hover:border-koi-gold transition-all duration-300">
              <div className="w-12 h-12 bg-koi-gold icon-modern mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <h4 className="font-semibold text-koi-navy">Content Writing</h4>
            </div>
            <div className="card-modern text-center hover:border-red-500 transition-all duration-300">
              <div className="w-12 h-12 bg-red-500 icon-modern mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h4 className="font-semibold text-koi-navy">Marketing & SEO</h4>
            </div>
            <div className="card-modern text-center hover:border-koi-teal transition-all duration-300">
              <div className="w-12 h-12 bg-koi-teal icon-modern mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="font-semibold text-koi-navy">Data Analytics</h4>
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
          <h2 className="heading-primary mb-6 text-center text-koi-navy">Ready to <span className="gradient-koi-text">Grow Your Freelance Career?</span></h2>
          <p className="text-lead text-gray-300 mb-10 max-w-2xl mx-auto">Join thousands of successful freelancers earning more and working smarter. Start bidding on quality projects today.</p>
          <Link href="/register" className="btn-koi-primary btn-large">
            Join as Freelancer →
          </Link>
          <div className="text-gray-300 text-sm mt-5">
            100% free to join • No subscription fees<br/>
            Only pay a small commission on completed work
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 mt-16">
            <div>
              <h4 className="text-2xl font-bold mb-2 text-koi-gold">$4.2k</h4>
              <p className="text-gray-300 text-sm">Avg. Monthly Earnings</p>
            </div>
            <div>
              <h4 className="text-2xl font-bold mb-2 text-koi-gold">500+</h4>
              <p className="text-gray-300 text-sm">Active Projects</p>
            </div>
            <div>
              <h4 className="text-2xl font-bold mb-2 text-koi-gold">100%</h4>
              <p className="text-gray-300 text-sm">Payment Protected</p>
            </div>
            <div>
              <h4 className="text-2xl font-bold mb-2 text-koi-gold">24/7</h4>
              <p className="text-gray-300 text-sm">Support Available</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
