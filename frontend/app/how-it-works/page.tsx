'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function HowItWorksPage() {
  const [activeTab, setActiveTab] = useState<'client' | 'freelancer'>('client')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-koi-navy py-20 text-white">
        <div className="container mx-auto px-5">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 animate-fade-in-up">
              How <span className="gradient-koi-text">KoiHire</span> Works
            </h1>
            <p className="text-xl text-gray-300 mb-10 leading-relaxed">
              The freelance marketplace that works smarter, not harder. Whether you're hiring talent or offering your skills, KoiHire makes it simple.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="btn-koi-primary btn-large">
                Get Started Free →
              </Link>
              <Link
                href="/marketplace"
                className="inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 rounded-lg font-semibold text-lg transition-all duration-300"
                style={{
                  color: 'white',
                  borderColor: '#2A9D8F'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2A9D8F'
                  e.currentTarget.style.borderColor = '#238276'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.borderColor = '#2A9D8F'
                }}
              >
                Explore Projects
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-5">
          <div className="flex justify-center gap-8">
            <button
              onClick={() => setActiveTab('client')}
              className={`px-8 py-4 font-semibold text-lg transition-all border-b-4 ${
                activeTab === 'client'
                  ? 'border-koi-orange text-koi-orange'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              For Clients
            </button>
            <button
              onClick={() => setActiveTab('freelancer')}
              className={`px-8 py-4 font-semibold text-lg transition-all border-b-4 ${
                activeTab === 'freelancer'
                  ? 'border-koi-teal text-koi-teal'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              For Freelancers
            </button>
          </div>
        </div>
      </section>

      {/* CLIENT TAB CONTENT */}
      {activeTab === 'client' && (
        <div className="animate-fade-in-up">
          {/* Project Posting Flow */}
          <section className="section-spacing bg-white">
            <div className="container-spacing">
              <div className="text-center mb-section">
                <h2 className="heading-secondary text-koi-navy">Post a Project & Get Competitive Bids</h2>
                <p className="text-lead max-w-2xl mx-auto">Stop searching through profiles. Let qualified freelancers come to you with tailored proposals.</p>
              </div>

              <div className="max-w-5xl mx-auto">
                {/* Step 1 */}
                <div className="flex flex-col md:flex-row gap-8 items-center mb-16">
                  <div className="w-full md:w-1/2 order-2 md:order-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-koi-orange rounded-full flex items-center justify-center text-white font-bold text-xl">1</div>
                      <h3 className="text-2xl font-bold text-koi-navy">Describe Your Project</h3>
                    </div>
                    <p className="text-gray-600 text-lg mb-4">
                      Create a detailed project brief with your requirements, budget range, and timeline. Our guided process helps you communicate exactly what you need.
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-gray-600">
                        <span className="text-green-500">✓</span>
                        Set your budget range
                      </li>
                      <li className="flex items-center gap-2 text-gray-600">
                        <span className="text-green-500">✓</span>
                        Define your timeline
                      </li>
                      <li className="flex items-center gap-2 text-gray-600">
                        <span className="text-green-500">✓</span>
                        Add specific requirements
                      </li>
                      <li className="flex items-center gap-2 text-gray-600">
                        <span className="text-green-500">✓</span>
                        Choose relevant skills
                      </li>
                    </ul>
                  </div>
                  <div className="w-full md:w-1/2 order-1 md:order-2">
                    <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-8 shadow-lg">
                      <div className="bg-white rounded-lg p-6 shadow-md">
                        <div className="text-sm text-gray-500 mb-2">Project Title</div>
                        <div className="text-lg font-semibold text-gray-900 mb-4">E-commerce Website Redesign</div>
                        <div className="text-sm text-gray-500 mb-2">Budget</div>
                        <div className="text-xl font-bold text-koi-orange mb-4">$3,000 - $5,000</div>
                        <div className="text-sm text-gray-500 mb-2">Timeline</div>
                        <div className="text-gray-700">3-4 weeks</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col md:flex-row gap-8 items-center mb-16">
                  <div className="w-full md:w-1/2">
                    <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl p-8 shadow-lg">
                      <div className="space-y-3">
                        <div className="bg-white rounded-lg p-4 shadow-md flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">MR</div>
                          <div className="flex-1">
                            <div className="font-semibold">Maria Rodriguez</div>
                            <div className="text-sm text-gray-600">⭐ 4.9 • UI/UX Expert</div>
                          </div>
                          <div className="text-koi-orange font-bold">$3,800</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-md flex items-center gap-3">
                          <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">AK</div>
                          <div className="flex-1">
                            <div className="font-semibold">Alex Kumar</div>
                            <div className="text-sm text-gray-600">⭐ 4.8 • Full Stack</div>
                          </div>
                          <div className="text-koi-teal font-bold">$4,200</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-md flex items-center gap-3">
                          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">SC</div>
                          <div className="flex-1">
                            <div className="font-semibold">Sarah Chen</div>
                            <div className="text-sm text-gray-600">⭐ 4.9 • E-commerce</div>
                          </div>
                          <div className="text-koi-orange font-bold">$3,600</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="w-full md:w-1/2">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-koi-teal rounded-full flex items-center justify-center text-white font-bold text-xl">2</div>
                      <h3 className="text-2xl font-bold text-koi-navy">Review Competitive Bids</h3>
                    </div>
                    <p className="text-gray-600 text-lg mb-4">
                      Within 24 hours, receive personalized proposals from qualified freelancers. Compare their approach, experience, and pricing.
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-gray-600">
                        <span className="text-green-500">✓</span>
                        Multiple competitive bids
                      </li>
                      <li className="flex items-center gap-2 text-gray-600">
                        <span className="text-green-500">✓</span>
                        Freelancer portfolios & ratings
                      </li>
                      <li className="flex items-center gap-2 text-gray-600">
                        <span className="text-green-500">✓</span>
                        Detailed proposals
                      </li>
                      <li className="flex items-center gap-2 text-gray-600">
                        <span className="text-green-500">✓</span>
                        Direct messaging
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="w-full md:w-1/2 order-2 md:order-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-koi-gold rounded-full flex items-center justify-center text-white font-bold text-xl">3</div>
                      <h3 className="text-2xl font-bold text-koi-navy">Work & Pay Securely</h3>
                    </div>
                    <p className="text-gray-600 text-lg mb-4">
                      Choose your freelancer, fund the escrow, and collaborate through our platform. Release payment as milestones are completed.
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-gray-600">
                        <span className="text-green-500">✓</span>
                        Secure escrow protection
                      </li>
                      <li className="flex items-center gap-2 text-gray-600">
                        <span className="text-green-500">✓</span>
                        Real-time messaging
                      </li>
                      <li className="flex items-center gap-2 text-gray-600">
                        <span className="text-green-500">✓</span>
                        Milestone-based releases
                      </li>
                      <li className="flex items-center gap-2 text-gray-600">
                        <span className="text-green-500">✓</span>
                        Review & rating system
                      </li>
                    </ul>
                  </div>
                  <div className="w-full md:w-1/2 order-1 md:order-2">
                    <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-8 shadow-lg">
                      <div className="bg-white rounded-lg p-6 shadow-md">
                        <div className="flex items-center justify-between mb-4">
                          <div className="font-semibold text-lg">Project Status</div>
                          <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">In Progress</div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Milestone 1</span>
                            <span className="text-green-600 font-semibold">✓ Completed</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Milestone 2</span>
                            <span className="text-blue-600 font-semibold">● In Progress</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Milestone 3</span>
                            <span className="text-gray-400">○ Pending</span>
                          </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Escrow Balance</span>
                            <span className="text-lg font-bold text-koi-navy">$3,800</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Service Marketplace for Clients */}
          <section className="section-spacing bg-gray-50">
            <div className="container-spacing">
              <div className="text-center mb-section">
                <h2 className="heading-secondary text-koi-navy">Or Browse Fixed-Price Services</h2>
                <p className="text-lead max-w-2xl mx-auto">Need something quick? Browse our service marketplace for ready-to-order packages.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                <div className="bg-white rounded-xl p-6 shadow-lg hover-lift">
                  <div className="text-4xl mb-4">🎨</div>
                  <h3 className="text-xl font-bold text-koi-navy mb-2">Fixed Pricing</h3>
                  <p className="text-gray-600 mb-4">Know exactly what you'll pay upfront with transparent package pricing.</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg hover-lift">
                  <div className="text-4xl mb-4">⚡</div>
                  <h3 className="text-xl font-bold text-koi-navy mb-2">Quick Delivery</h3>
                  <p className="text-gray-600 mb-4">Get your work done fast with pre-defined delivery timelines.</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg hover-lift">
                  <div className="text-4xl mb-4">🛍️</div>
                  <h3 className="text-xl font-bold text-koi-navy mb-2">Easy Ordering</h3>
                  <p className="text-gray-600 mb-4">Browse, select, and order—just like online shopping.</p>
                </div>
              </div>

              <div className="text-center mt-10">
                <Link href="/services" className="btn-koi-primary btn-large">
                  Browse Services →
                </Link>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* FREELANCER TAB CONTENT */}
      {activeTab === 'freelancer' && (
        <div className="animate-fade-in-up">
          {/* Bidding on Projects Flow */}
          <section className="section-spacing bg-white">
            <div className="container-spacing">
              <div className="text-center mb-section">
                <h2 className="heading-secondary text-koi-navy">Bid on Projects & Win Work</h2>
                <p className="text-lead max-w-2xl mx-auto">Browse projects that match your skills and submit compelling proposals to win clients.</p>
              </div>

              <div className="max-w-5xl mx-auto">
                {/* Step 1 */}
                <div className="flex flex-col md:flex-row gap-8 items-center mb-16">
                  <div className="w-full md:w-1/2 order-2 md:order-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-koi-teal rounded-full flex items-center justify-center text-white font-bold text-xl">1</div>
                      <h3 className="text-2xl font-bold text-koi-navy">Browse Projects</h3>
                    </div>
                    <p className="text-gray-600 text-lg mb-4">
                      Explore hundreds of active projects from serious clients. Filter by category, budget, and skills to find the perfect match.
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-gray-600">
                        <span className="text-green-500">✓</span>
                        Filter by your skills
                      </li>
                      <li className="flex items-center gap-2 text-gray-600">
                        <span className="text-green-500">✓</span>
                        See budget ranges upfront
                      </li>
                      <li className="flex items-center gap-2 text-gray-600">
                        <span className="text-green-500">✓</span>
                        View client history
                      </li>
                      <li className="flex items-center gap-2 text-gray-600">
                        <span className="text-green-500">✓</span>
                        New projects daily
                      </li>
                    </ul>
                  </div>
                  <div className="w-full md:w-1/2 order-1 md:order-2">
                    <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl p-8 shadow-lg">
                      <div className="space-y-3">
                        <div className="bg-white rounded-lg p-4 shadow-md">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold">Logo Design</div>
                            <div className="text-sm text-koi-orange font-bold">$500-$800</div>
                          </div>
                          <div className="text-sm text-gray-600">Design • Branding</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-md">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold">React Web App</div>
                            <div className="text-sm text-koi-orange font-bold">$3k-$5k</div>
                          </div>
                          <div className="text-sm text-gray-600">Development • React</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-md">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold">SEO Content</div>
                            <div className="text-sm text-koi-orange font-bold">$200-$400</div>
                          </div>
                          <div className="text-sm text-gray-600">Writing • Marketing</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col md:flex-row gap-8 items-center mb-16">
                  <div className="w-full md:w-1/2">
                    <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-8 shadow-lg">
                      <div className="bg-white rounded-lg p-6 shadow-md">
                        <div className="text-sm text-gray-500 mb-2">Your Proposal</div>
                        <div className="text-lg font-semibold text-gray-900 mb-4">E-commerce Website Redesign</div>
                        <div className="text-sm text-gray-600 mb-4">
                          "I've reviewed your project and I'm confident I can deliver a modern, conversion-optimized design..."
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                          <div>
                            <div className="text-sm text-gray-500">Your Bid</div>
                            <div className="text-2xl font-bold text-koi-orange">$3,800</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Timeline</div>
                            <div className="text-lg font-semibold">3 weeks</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="w-full md:w-1/2">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-koi-orange rounded-full flex items-center justify-center text-white font-bold text-xl">2</div>
                      <h3 className="text-2xl font-bold text-koi-navy">Submit Your Proposal</h3>
                    </div>
                    <p className="text-gray-600 text-lg mb-4">
                      Craft a personalized proposal that showcases your expertise and approach. Set your price and timeline.
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-gray-600">
                        <span className="text-green-500">✓</span>
                        Highlight your relevant experience
                      </li>
                      <li className="flex items-center gap-2 text-gray-600">
                        <span className="text-green-500">✓</span>
                        Set competitive pricing
                      </li>
                      <li className="flex items-center gap-2 text-gray-600">
                        <span className="text-green-500">✓</span>
                        Propose your timeline
                      </li>
                      <li className="flex items-center gap-2 text-gray-600">
                        <span className="text-green-500">✓</span>
                        Ask clarifying questions
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="w-full md:w-1/2 order-2 md:order-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-koi-gold rounded-full flex items-center justify-center text-white font-bold text-xl">3</div>
                      <h3 className="text-2xl font-bold text-koi-navy">Deliver & Get Paid</h3>
                    </div>
                    <p className="text-gray-600 text-lg mb-4">
                      Once hired, work directly with the client. Complete milestones and get paid securely through escrow.
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-gray-600">
                        <span className="text-green-500">✓</span>
                        Payment secured in escrow
                      </li>
                      <li className="flex items-center gap-2 text-gray-600">
                        <span className="text-green-500">✓</span>
                        Milestone-based payments
                      </li>
                      <li className="flex items-center gap-2 text-gray-600">
                        <span className="text-green-500">✓</span>
                        Direct client communication
                      </li>
                      <li className="flex items-center gap-2 text-gray-600">
                        <span className="text-green-500">✓</span>
                        Build your reputation
                      </li>
                    </ul>
                  </div>
                  <div className="w-full md:w-1/2 order-1 md:order-2">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 shadow-lg">
                      <div className="bg-white rounded-lg p-6 shadow-md">
                        <div className="flex items-center justify-between mb-6">
                          <div className="font-semibold text-lg">Your Earnings</div>
                          <div className="text-3xl font-bold text-green-600">$8,450</div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-600">E-commerce Site</span>
                            <span className="text-green-600 font-semibold">$3,800</span>
                          </div>
                          <div className="flex items-center justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-600">Logo Design</span>
                            <span className="text-green-600 font-semibold">$650</span>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-gray-600">Mobile App</span>
                            <span className="text-green-600 font-semibold">$4,000</span>
                          </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-200">
                          <div className="text-center text-sm text-gray-600">
                            💰 Payments released instantly after approval
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Sell Services */}
          <section className="section-spacing bg-gray-50">
            <div className="container-spacing">
              <div className="text-center mb-section">
                <h2 className="heading-secondary text-koi-navy">Or Sell Your Services Directly</h2>
                <p className="text-lead max-w-2xl mx-auto">Create service packages with fixed pricing. Clients find you and order instantly.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                <div className="bg-white rounded-xl p-6 shadow-lg hover-lift">
                  <div className="text-4xl mb-4">📦</div>
                  <h3 className="text-xl font-bold text-koi-navy mb-2">Package Your Skills</h3>
                  <p className="text-gray-600 mb-4">Create Basic, Standard, and Premium packages with clear deliverables.</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg hover-lift">
                  <div className="text-4xl mb-4">💰</div>
                  <h3 className="text-xl font-bold text-koi-navy mb-2">Set Your Prices</h3>
                  <p className="text-gray-600 mb-4">You control the pricing. No bidding wars—just fair value for your work.</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg hover-lift">
                  <div className="text-4xl mb-4">🚀</div>
                  <h3 className="text-xl font-bold text-koi-navy mb-2">Get Discovered</h3>
                  <p className="text-gray-600 mb-4">Clients browse and order directly. Build passive income streams.</p>
                </div>
              </div>

              <div className="text-center mt-10">
                <Link href="/freelancer/services/create" className="btn-koi-primary btn-large">
                  Create Your Service →
                </Link>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Final CTA */}
      <section className="section-spacing text-white text-center" style={{ background: 'linear-gradient(to right, #264653, #374151)' }}>
        <div className="container-spacing">
          <h2 className="heading-primary mb-6 text-white">
            Ready to Get Started?
          </h2>
          <p className="text-lead text-gray-300 mb-10 max-w-2xl mx-auto">
            Join thousands of clients and freelancers who trust KoiHire for secure, efficient project collaboration.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-koi-primary btn-large">
              Sign Up Free →
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 rounded-lg font-semibold text-lg transition-all duration-300"
              style={{
                color: 'white',
                borderColor: '#2A9D8F'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2A9D8F'
                e.currentTarget.style.borderColor = '#238276'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.borderColor = '#2A9D8F'
              }}
            >
              Explore Projects
            </Link>
          </div>
          <div className="text-gray-400 text-sm mt-8">
            No credit card required • Free to join • Only pay when you transact
          </div>
        </div>
      </section>
    </div>
  )
}
