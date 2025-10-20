'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AuthRequired } from '@/components/auth/ProtectedRoute'
import {
  Star,
  Crown,
  TrendingUp,
  Check,
  Zap,
  Target,
  Award,
  BarChart3,
  Users,
  Eye,
  ArrowRight,
  Sparkles
} from 'lucide-react'

interface PremiumTier {
  tier: 'FEATURED' | 'PREMIUM' | 'SPOTLIGHT'
  price: number
  title: string
  tagline: string
  description: string
  features: string[]
  icon: any
  gradient: string
  recommended?: boolean
  badge?: string
}

export default function PremiumPage() {
  const router = useRouter()
  const [selectedTier, setSelectedTier] = useState<'FEATURED' | 'PREMIUM' | 'SPOTLIGHT'>('PREMIUM')

  const premiumTiers: PremiumTier[] = [
    {
      tier: 'FEATURED',
      price: 49,
      title: 'Featured',
      tagline: 'Stand Out',
      description: 'Get enhanced visibility and attract more qualified freelancers to your project',
      features: [
        'Featured badge on your project',
        '2x more visibility in search results',
        'Priority placement in listings',
        'Enhanced project styling',
        'Email notifications to matching freelancers',
        '30-day featured duration'
      ],
      icon: Star,
      gradient: 'from-blue-500 to-indigo-600'
    },
    {
      tier: 'PREMIUM',
      price: 149,
      title: 'Premium',
      tagline: 'Maximum Exposure',
      description: 'Get the highest exposure and attract top-tier freelancers with advanced features',
      features: [
        'Premium badge on your project',
        '5x more qualified applications',
        'Featured on homepage recommendations',
        'Priority notifications to elite freelancers',
        'Advanced analytics dashboard',
        'Dedicated account support',
        'Project promotion in newsletters',
        '60-day featured duration'
      ],
      icon: TrendingUp,
      gradient: 'from-purple-500 to-pink-600',
      recommended: true,
      badge: 'Most Popular'
    },
    {
      tier: 'SPOTLIGHT',
      price: 299,
      title: 'Spotlight',
      tagline: 'Elite Access',
      description: 'Exclusive access to our most elite freelancers with guaranteed quality results',
      features: [
        'SPOTLIGHT badge - highest prestige',
        'Hero carousel placement on homepage',
        'Top position on all dashboards',
        '10x more elite applications',
        'Quality guarantee from verified experts',
        'Executive analytics & insights',
        'White-glove concierge service',
        'Priority support (24/7)',
        'Featured in all marketing channels',
        '90-day featured duration'
      ],
      icon: Crown,
      gradient: 'from-amber-500 to-orange-600',
      badge: 'Best Value'
    }
  ]

  const comparisonFeatures = [
    {
      category: 'Visibility',
      features: [
        { name: 'Featured Badge', featured: true, premium: true, spotlight: true },
        { name: 'Priority in Search', featured: true, premium: true, spotlight: true },
        { name: 'Homepage Featured Section', featured: false, premium: true, spotlight: true },
        { name: 'Hero Carousel Placement', featured: false, premium: false, spotlight: true },
        { name: 'Newsletter Promotion', featured: false, premium: true, spotlight: true }
      ]
    },
    {
      category: 'Applications',
      features: [
        { name: 'Expected Application Boost', featured: '2x', premium: '5x', spotlight: '10x' },
        { name: 'Notifications to Elite Freelancers', featured: false, premium: true, spotlight: true },
        { name: 'Quality Guarantee', featured: false, premium: false, spotlight: true }
      ]
    },
    {
      category: 'Analytics & Support',
      features: [
        { name: 'Basic Analytics', featured: true, premium: true, spotlight: true },
        { name: 'Advanced Analytics Dashboard', featured: false, premium: true, spotlight: true },
        { name: 'Executive Insights', featured: false, premium: false, spotlight: true },
        { name: 'Dedicated Support', featured: false, premium: true, spotlight: true },
        { name: '24/7 Priority Support', featured: false, premium: false, spotlight: true }
      ]
    }
  ]

  const handleGetStarted = (tier: 'FEATURED' | 'PREMIUM' | 'SPOTLIGHT') => {
    // Navigate to project creation with premium tier selected
    router.push(`/dashboard?tab=projects&premium=${tier}`)
  }

  return (
    <AuthRequired>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-koi-navy to-gray-800 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-koi-orange/20 border border-koi-orange/30 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-koi-gold" />
              <span className="text-sm font-medium">Boost Your Project Success</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold mb-6">
              Get More <span className="text-koi-orange">Qualified Applications</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Stand out from the crowd and connect with the best freelancers. Premium projects get 2-10x more applications from top-rated professionals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-koi-orange hover:bg-koi-orange/90 text-white"
              >
                View Pricing
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="border-white text-white hover:bg-white/10"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-koi-teal/10 rounded-full mb-4">
                  <TrendingUp className="w-8 h-8 text-koi-teal" />
                </div>
                <div className="text-4xl font-bold text-koi-navy mb-2">10x</div>
                <div className="text-gray-600">More Applications</div>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-koi-orange/10 rounded-full mb-4">
                  <Users className="w-8 h-8 text-koi-orange" />
                </div>
                <div className="text-4xl font-bold text-koi-navy mb-2">92%</div>
                <div className="text-gray-600">Client Satisfaction</div>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                  <Target className="w-8 h-8 text-purple-600" />
                </div>
                <div className="text-4xl font-bold text-koi-navy mb-2">3x</div>
                <div className="text-gray-600">Faster Hiring</div>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-koi-gold/10 rounded-full mb-4">
                  <Award className="w-8 h-8 text-koi-gold" />
                </div>
                <div className="text-4xl font-bold text-koi-navy mb-2">98%</div>
                <div className="text-gray-600">Project Success Rate</div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section id="pricing" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-koi-navy mb-4">Choose Your Premium Tier</h2>
              <p className="text-xl text-gray-600">Select the plan that best fits your project needs</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {premiumTiers.map((tier) => (
                <div
                  key={tier.tier}
                  className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl ${
                    tier.recommended ? 'ring-2 ring-koi-orange scale-105' : ''
                  }`}
                >
                  {/* Badge */}
                  {tier.badge && (
                    <div className="absolute top-0 right-0 bg-koi-orange text-white px-4 py-1 text-sm font-semibold rounded-bl-lg">
                      {tier.badge}
                    </div>
                  )}

                  {/* Header */}
                  <div className={`bg-gradient-to-r ${tier.gradient} p-8 text-white`}>
                    <tier.icon className="w-12 h-12 mb-4" />
                    <h3 className="text-2xl font-bold mb-2">{tier.title}</h3>
                    <p className="text-sm opacity-90 mb-4">{tier.tagline}</p>
                    <div className="flex items-baseline">
                      <span className="text-5xl font-bold">${tier.price}</span>
                      <span className="text-lg ml-2 opacity-90">/project</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-8">
                    <p className="text-gray-600 mb-6">{tier.description}</p>

                    <ul className="space-y-4 mb-8">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-koi-teal flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => handleGetStarted(tier.tier)}
                      className={`w-full ${
                        tier.recommended
                          ? 'bg-koi-orange hover:bg-koi-orange/90'
                          : 'bg-koi-navy hover:bg-koi-navy/90'
                      }`}
                    >
                      Get Started
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-koi-navy mb-4">Feature Comparison</h2>
              <p className="text-xl text-gray-600">Compare all features across premium tiers</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-6 text-koi-navy font-semibold">Features</th>
                    <th className="text-center py-4 px-6 text-koi-navy font-semibold">Featured</th>
                    <th className="text-center py-4 px-6 text-koi-navy font-semibold bg-koi-orange/5">
                      Premium
                      <div className="text-xs text-koi-orange font-normal">Recommended</div>
                    </th>
                    <th className="text-center py-4 px-6 text-koi-navy font-semibold">Spotlight</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((category, catIndex) => (
                    <>
                      <tr key={`cat-${catIndex}`} className="bg-gray-50">
                        <td colSpan={4} className="py-3 px-6 font-semibold text-koi-navy">
                          {category.category}
                        </td>
                      </tr>
                      {category.features.map((feature, featIndex) => (
                        <tr key={`feat-${catIndex}-${featIndex}`} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-6 text-gray-700">{feature.name}</td>
                          <td className="py-4 px-6 text-center">
                            {typeof feature.featured === 'boolean' ? (
                              feature.featured ? (
                                <Check className="w-5 h-5 text-koi-teal mx-auto" />
                              ) : (
                                <span className="text-gray-300">—</span>
                              )
                            ) : (
                              <span className="font-semibold text-koi-navy">{feature.featured}</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-center bg-koi-orange/5">
                            {typeof feature.premium === 'boolean' ? (
                              feature.premium ? (
                                <Check className="w-5 h-5 text-koi-teal mx-auto" />
                              ) : (
                                <span className="text-gray-300">—</span>
                              )
                            ) : (
                              <span className="font-semibold text-koi-navy">{feature.premium}</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-center">
                            {typeof feature.spotlight === 'boolean' ? (
                              feature.spotlight ? (
                                <Check className="w-5 h-5 text-koi-teal mx-auto" />
                              ) : (
                                <span className="text-gray-300">—</span>
                              )
                            ) : (
                              <span className="font-semibold text-koi-navy">{feature.spotlight}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-koi-navy to-gray-800 text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to Boost Your Project?</h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of successful clients who found their perfect freelancer with premium features
            </p>
            <Button
              size="lg"
              onClick={() => router.push('/dashboard?tab=projects')}
              className="bg-koi-orange hover:bg-koi-orange/90 text-white"
            >
              Post a Premium Project
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </section>
      </div>
    </AuthRequired>
  )
}
