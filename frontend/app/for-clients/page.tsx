import Link from 'next/link'

export default function ForClientsPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-koi-navy py-20 text-white">
        <div className="container mx-auto px-5">
          <div className="grid lg:grid-cols-2 gap-15 items-center">
            <div className="animate-fade-in-up">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-8">
                Post Your Project. <span className="text-koi-gold">Get Bids.</span> <span className="text-koi-orange">Deliver Results.</span>
              </h1>
              <p className="text-xl text-gray-300 mb-10 leading-relaxed">
                Stop searching through endless freelancer profiles. Post your project once and let skilled professionals compete with personalized proposals tailored to your needs.
              </p>
              <div className="flex gap-5 mb-10">
                <Link href="/register" className="btn-koi-primary btn-large">
                  Post Your Project →
                </Link>
                <Link href="/login" className="btn-koi-secondary btn-large">
                  Sign In
                </Link>
              </div>
              <div className="flex gap-10">
                <div className="flex items-center gap-3 text-gray-300">
                  <span className="text-koi-teal">✓</span>
                  Free to Post
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <span className="text-koi-teal">✓</span>
                  Verified Talent
                </div>
              </div>
            </div>
            
            {/* Project Bidding Card */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 text-white hover-lift border border-koi-teal/30">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <div className="text-lg font-semibold mb-1">E-commerce Website Redesign</div>
                  <div className="text-gray-300 text-sm">Budget: $3,000 - $5,000 • Posted 2 hours ago</div>
                </div>
                <div className="bg-koi-teal/20 text-koi-teal px-3 py-1 rounded-full text-sm font-medium">
                  Active
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 bg-koi-navy/50 rounded-lg">
                  <div className="w-10 h-10 gradient-koi rounded-full flex items-center justify-center font-bold">M</div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">Maria Rodriguez</div>
                    <div className="text-koi-gold text-xs">★ 4.9 • UI/UX Expert</div>
                  </div>
                  <div className="text-right">
                    <div className="text-koi-orange font-bold">$3,800</div>
                    <div className="text-gray-300 text-xs">3 weeks</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 bg-koi-navy/50 rounded-lg">
                  <div className="w-10 h-10 gradient-koi-teal rounded-full flex items-center justify-center font-bold">A</div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">Alex Kumar</div>
                    <div className="text-koi-gold text-xs">★ 4.8 • Full Stack Dev</div>
                  </div>
                  <div className="text-right">
                    <div className="text-koi-teal font-bold">$4,200</div>
                    <div className="text-gray-300 text-xs">4 weeks</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 bg-koi-navy/50 rounded-lg">
                  <div className="w-10 h-10 gradient-koi rounded-full flex items-center justify-center font-bold">S</div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">Sarah Chen</div>
                    <div className="text-koi-gold text-xs">★ 4.9 • E-commerce Specialist</div>
                  </div>
                  <div className="text-right">
                    <div className="text-koi-orange font-bold">$3,600</div>
                    <div className="text-gray-300 text-xs">2 weeks</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-3 bg-gradient-to-r from-koi-orange/20 to-koi-teal/20 rounded-lg text-center">
                <div className="text-sm font-medium">🎯 15 Total Bids • Average: $3,900</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works for Clients */}
      <section className="section-spacing bg-white">
        <div className="container-spacing">
          <div className="text-center mb-section">
            <h2 className="heading-secondary text-koi-navy">How to Get Your Project Done</h2>
            <p className="text-lead max-w-2xl mx-auto">Simple steps to connect with skilled freelancers and turn your vision into reality.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-section">
            <div className="text-center animate-fade-in-up">
              <div className="w-16 h-16 bg-koi-orange icon-modern mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="heading-tertiary text-koi-navy">Describe Your Project</h3>
              <p className="text-spacing-relaxed text-gray-600">Create a detailed brief with your requirements, budget, and timeline. Our guided process helps you communicate your vision clearly.</p>
            </div>
            <div className="text-center animate-fade-in-up">
              <div className="w-16 h-16 bg-koi-teal icon-modern mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="heading-tertiary text-koi-navy">Review Competitive Bids</h3>
              <p className="text-spacing-relaxed text-gray-600">Receive personalized proposals from qualified freelancers. Compare approaches, timelines, and pricing to find the perfect match.</p>
            </div>
            <div className="text-center animate-fade-in-up">
              <div className="w-16 h-16 bg-koi-gold icon-modern mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="heading-tertiary text-koi-navy">Launch & Collaborate</h3>
              <p className="text-spacing-relaxed text-gray-600">Work directly with your chosen freelancer through our platform. Track progress, communicate seamlessly, and pay securely through escrow.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Clients Choose KoiHire */}
      <section className="section-spacing bg-gray-50">
        <div className="container-spacing">
          <h2 className="heading-secondary text-koi-navy text-center mb-section">Why Businesses Trust KoiHire</h2>
          <div className="grid lg:grid-cols-2 gap-section items-start">
            <div className="space-y-8">
              <div className="flex gap-6 animate-fade-in-up">
                <div className="w-12 h-12 bg-koi-orange icon-modern flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div>
                  <h4 className="heading-tertiary text-koi-navy">Top-Tier Talent</h4>
                  <p className="text-spacing-relaxed text-gray-600">Access verified freelancers with proven track records. All talent goes through our screening process to ensure quality.</p>
                </div>
              </div>
              
              <div className="flex gap-6 animate-fade-in-up">
                <div className="w-12 h-12 bg-koi-teal icon-modern flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="heading-tertiary text-koi-navy">Competitive Pricing</h4>
                  <p className="text-spacing-relaxed text-gray-600">Multiple freelancers compete for your project, naturally driving down costs while maintaining high quality standards.</p>
                </div>
              </div>
              
              <div className="flex gap-6 animate-fade-in-up">
                <div className="w-12 h-12 bg-koi-teal icon-modern flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h4 className="heading-tertiary text-koi-navy">Fast Turnaround</h4>
                  <p className="text-spacing-relaxed text-gray-600">Get proposals within 24 hours and start work immediately. No waiting weeks for the right freelancer to respond.</p>
                </div>
              </div>
              
              <div className="flex gap-6 animate-fade-in-up">
                <div className="w-12 h-12 bg-koi-gold icon-modern flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h4 className="heading-tertiary text-koi-navy">Risk-Free Payments</h4>
                  <p className="text-spacing-relaxed text-gray-600">Your payment is held in escrow until work is completed to your satisfaction. Get exactly what you pay for.</p>
                </div>
              </div>
            </div>
            
            {/* Client Success Stats */}
            <div className="bg-white rounded-xl p-8 border hover-lift">
              <h4 className="text-xl font-bold text-koi-navy mb-6 text-center">Average Client Experience</h4>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">94%</div>
                  <div className="text-gray-600 text-sm">Project Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">18 hrs</div>
                  <div className="text-gray-600 text-sm">Time to First Bid</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">35%</div>
                  <div className="text-gray-600 text-sm">Cost Savings</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">4.8⭐</div>
                  <div className="text-gray-600 text-sm">Avg. Freelancer Rating</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg text-center">
                <div className="text-sm font-medium text-gray-700">💼 Save 40+ hours per project by letting freelancers come to you</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Let Our Freelancers Help */}
      <section className="section-spacing bg-white">
        <div className="container-spacing">
          <div className="text-center mb-section">
            <h2 className="heading-secondary text-koi-navy">Let Our Freelancers Help</h2>
            <p className="text-lead max-w-2xl mx-auto">Skilled professionals ready to bring your vision to life across every category.</p>
          </div>
          
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6">
            <Link href="/services?category=web-development" className="card-modern text-center hover:border-koi-orange cursor-pointer transition-all duration-300">
              <div className="w-12 h-12 bg-koi-orange icon-modern mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="font-semibold text-koi-navy mb-2">Web Development</h4>
              <p className="text-gray-600 text-sm">$500</p>
            </Link>
            <Link href="/services?category=mobile-development" className="card-modern text-center hover:border-koi-teal cursor-pointer transition-all duration-300">
              <div className="w-12 h-12 bg-koi-teal icon-modern mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="font-semibold text-koi-navy mb-2">Mobile Apps</h4>
              <p className="text-gray-600 text-sm">$2,000</p>
            </Link>
            <Link href="/services?category=design-branding" className="card-modern text-center hover:border-yellow-500 cursor-pointer transition-all duration-300">
              <div className="w-12 h-12 bg-yellow-500 icon-modern mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
              </div>
              <h4 className="font-semibold text-koi-navy mb-2">Design & Branding</h4>
              <p className="text-gray-600 text-sm">$300</p>
            </Link>
            <Link href="/services?category=content-copywriting" className="card-modern text-center hover:border-koi-gold cursor-pointer transition-all duration-300">
              <div className="w-12 h-12 bg-koi-gold icon-modern mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <h4 className="font-semibold text-koi-navy mb-2">Content & Copywriting</h4>
              <p className="text-gray-600 text-sm">$100</p>
            </Link>
            <Link href="/services?category=marketing-seo" className="card-modern text-center hover:border-red-500 cursor-pointer transition-all duration-300">
              <div className="w-12 h-12 bg-red-500 icon-modern mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h4 className="font-semibold text-koi-navy mb-2">Marketing & SEO</h4>
              <p className="text-gray-600 text-sm">$200</p>
            </Link>
            <Link href="/services?category=data-analytics" className="card-modern text-center hover:border-koi-teal cursor-pointer transition-all duration-300">
              <div className="w-12 h-12 bg-koi-teal icon-modern mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="font-semibold text-koi-navy mb-2">Data & Analytics</h4>
              <p className="text-gray-600 text-sm">$400</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-5">
          <div className="text-center mb-15">
            <h2 className="text-4xl lg:text-5xl font-bold text-koi-navy mb-5">Client Success Stories</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">See how businesses like yours have achieved amazing results with KoiHire.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 hover-lift">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-koi-orange rounded-full flex items-center justify-center text-white font-bold">TC</div>
                <div>
                  <div className="font-semibold">TechCorp</div>
                  <div className="text-gray-600 text-sm">E-commerce Platform</div>
                </div>
              </div>
              <p className="text-gray-600 mb-4">"We needed a complete e-commerce overhaul. Posted our project and received 12 excellent proposals. The winning freelancer delivered beyond our expectations for 30% less than quoted elsewhere."</p>
              <div className="flex items-center gap-2 text-yellow-400">
                <span>⭐⭐⭐⭐⭐</span>
                <span className="text-gray-600 text-sm ml-2">5.0 rating</span>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 hover-lift">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-koi-teal rounded-full flex items-center justify-center text-white font-bold">SM</div>
                <div>
                  <div className="font-semibold">StartupMax</div>
                  <div className="text-gray-600 text-sm">Mobile App Development</div>
                </div>
              </div>
              <p className="text-gray-600 mb-4">"Posted our app idea and got connected with an amazing React Native developer. The competitive bidding saved us $8,000 while getting exactly what we wanted. Launched in 6 weeks!"</p>
              <div className="flex items-center gap-2 text-yellow-400">
                <span>⭐⭐⭐⭐⭐</span>
                <span className="text-gray-600 text-sm ml-2">5.0 rating</span>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 hover-lift">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-koi-teal rounded-full flex items-center justify-center text-white font-bold">BD</div>
                <div>
                  <div className="font-semibold">Brand Dynamics</div>
                  <div className="text-gray-600 text-sm">Rebranding Project</div>
                </div>
              </div>
              <p className="text-gray-600 mb-4">"Needed a complete brand refresh including logo, website, and marketing materials. The quality of proposals we received was incredible. Our chosen designer transformed our entire brand identity."</p>
              <div className="flex items-center gap-2 text-yellow-400">
                <span>⭐⭐⭐⭐⭐</span>
                <span className="text-gray-600 text-sm ml-2">5.0 rating</span>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <h2 className="heading-primary mb-6 text-center text-koi-navy">Ready to Start Your <span className="gradient-koi-text">Next Project?</span></h2>
          <p className="text-lead text-gray-300 mb-10 max-w-2xl mx-auto">Join thousands of successful businesses who've discovered the power of competitive bidding. Get quality work done faster and for less.</p>
          <Link href="/register" className="btn-koi-primary btn-large">
            Post Your Project Today →
          </Link>
          <div className="text-gray-300 text-sm mt-5">
            No credit card required • Free to post<br/>
            Only pay when you find the perfect match
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 mt-16">
            <div>
              <h4 className="text-2xl font-bold mb-2 text-koi-gold">3 min</h4>
              <p className="text-gray-300 text-sm">Project Setup</p>
            </div>
            <div>
              <h4 className="text-2xl font-bold mb-2 text-koi-gold">24 hrs</h4>
              <p className="text-gray-300 text-sm">First Proposals</p>
            </div>
            <div>
              <h4 className="text-2xl font-bold mb-2 text-koi-gold">100%</h4>
              <p className="text-gray-300 text-sm">Secure</p>
            </div>
            <div>
              <h4 className="text-2xl font-bold mb-2 text-koi-gold">35%</h4>
              <p className="text-gray-300 text-sm">Avg. Savings</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}