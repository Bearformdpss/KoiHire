'use client'

import { Lightbulb, TrendingUp, DollarSign, Users, Target, Zap } from 'lucide-react'

export default function SuccessTipsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-koi-orange to-koi-teal text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Success Tips for Freelancers</h1>
          <p className="text-xl text-white/90 max-w-3xl">
            Discover why KoiHire is the smartest choice for growing your freelance career
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Why KoiHire Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Why Choose KoiHire?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-start">
              <div className="bg-koi-orange/10 p-3 rounded-lg mb-4">
                <DollarSign className="w-8 h-8 text-koi-orange" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Lower Fees</h3>
              <p className="text-gray-600">
                We take a smaller cut from your earnings compared to other platforms. Keep more of what you earn!
              </p>
            </div>

            <div className="flex flex-col items-start">
              <div className="bg-koi-teal/10 p-3 rounded-lg mb-4">
                <Users className="w-8 h-8 text-koi-teal" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Less Competition</h3>
              <p className="text-gray-600">
                We're not as saturated as massive marketplaces. Stand out easier and win more projects.
              </p>
            </div>

            <div className="flex flex-col items-start">
              <div className="bg-koi-gold/10 p-3 rounded-lg mb-4">
                <Target className="w-8 h-8 text-koi-gold" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Dual Opportunities</h3>
              <p className="text-gray-600">
                Find work through client-posted projects AND offer your own services. Two ways to earn!
              </p>
            </div>
          </div>
        </div>

        {/* Opportunity Types */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Two Ways to Find Work</h2>

          <div className="space-y-6">
            <div className="border-l-4 border-koi-orange pl-6">
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                <Zap className="inline w-6 h-6 mr-2" />
                Client-Posted Projects
              </h3>
              <p className="text-gray-600 mb-3">
                Browse projects posted by clients looking for your skills. Submit proposals and compete for work based on your experience and rates.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Clients come to you with defined project needs</li>
                <li>Submit competitive bids with your unique value proposition</li>
                <li>Build relationships through successful project delivery</li>
                <li>Get rated and build your reputation</li>
              </ul>
            </div>

            <div className="border-l-4 border-koi-teal pl-6">
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                <TrendingUp className="inline w-6 h-6 mr-2" />
                Your Service Listings
              </h3>
              <p className="text-gray-600 mb-3">
                Create service packages that showcase exactly what you offer. Clients can purchase directly without the bidding process.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Define your services with clear deliverables and pricing</li>
                <li>Offer tiered packages (Basic, Standard, Premium)</li>
                <li>Clients buy immediately without negotiation</li>
                <li>Build a service portfolio that attracts repeat customers</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Success Tips */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <Lightbulb className="w-8 h-8 mr-3 text-koi-gold" />
            Pro Tips for Success
          </h2>

          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">1. Complete Your Profile</h3>
              <p className="text-gray-600">
                Add a professional photo, detailed bio, portfolio samples, and skills. Complete profiles win 3x more projects.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">2. Create Compelling Service Packages</h3>
              <p className="text-gray-600">
                Offer clear, well-defined services with attractive pricing tiers. Make it easy for clients to understand what they'll get.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">3. Submit Quality Proposals</h3>
              <p className="text-gray-600">
                When bidding on projects, personalize each proposal. Show you understand the client's needs and explain your unique approach.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">4. Deliver Exceptional Work</h3>
              <p className="text-gray-600">
                Great reviews are your best marketing. Exceed expectations, communicate clearly, and deliver on time.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">5. Stay Active & Responsive</h3>
              <p className="text-gray-600">
                Check for new projects daily and respond to client messages within 24 hours. Active freelancers get more opportunities.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">6. Leverage Both Channels</h3>
              <p className="text-gray-600">
                Don't just rely on one method. Bid on projects while also maintaining service listings. Diversify your income streams!
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-koi-orange to-koi-teal text-white rounded-lg p-8 mt-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Grow Your Freelance Business?</h2>
          <p className="text-xl mb-6">Join KoiHire today and start winning projects with lower fees and less competition!</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/projects"
              className="bg-white text-koi-orange px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Browse Projects
            </a>
            <a
              href="/freelancer/services/create"
              className="bg-koi-teal text-white px-8 py-3 rounded-lg font-semibold hover:bg-koi-teal/90 transition-colors border-2 border-white"
            >
              Create a Service
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
