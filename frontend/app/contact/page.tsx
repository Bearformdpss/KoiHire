'use client'

import { useState } from 'react'
import { Mail, Send, MessageCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)

    try {
      // TODO: Implement backend contact form endpoint
      // For now, just show success message
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast.success('Message sent! We\'ll get back to you within 24 hours.')
      setFormData({ name: '', email: '', subject: '', message: '' })
    } catch (error) {
      toast.error('Failed to send message. Please email us directly at support@koihire.com')
    } finally {
      setSending(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-koi-orange to-koi-teal text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-white/90 max-w-3xl">
            Have questions? We're here to help. Reach out and we'll respond as soon as possible.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <MessageCircle className="w-6 h-6 mr-2 text-koi-orange" />
              Send Us a Message
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-koi-orange focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-koi-orange focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-koi-orange focus:border-transparent"
                >
                  <option value="">Select a subject</option>
                  <option value="general">General Inquiry</option>
                  <option value="account">Account Support</option>
                  <option value="payment">Payment Issue</option>
                  <option value="technical">Technical Support</option>
                  <option value="dispute">Dispute Resolution</option>
                  <option value="feedback">Feedback & Suggestions</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-koi-orange focus:border-transparent resize-none"
                  placeholder="Tell us how we can help you..."
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full bg-gradient-to-r from-koi-orange to-koi-teal text-white py-3 px-6 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {sending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            {/* Email Contact */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="flex items-start">
                <div className="bg-koi-orange/10 p-3 rounded-lg">
                  <Mail className="w-6 h-6 text-koi-orange" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Email Us</h3>
                  <p className="text-gray-600 mb-3">
                    For direct support, send us an email and we'll respond within 24 hours.
                  </p>
                  <a
                    href="mailto:support@koihire.com"
                    className="text-koi-orange hover:text-koi-orange/80 font-semibold text-lg"
                  >
                    support@koihire.com
                  </a>
                </div>
              </div>
            </div>

            {/* Response Time */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="flex items-start">
                <div className="bg-koi-teal/10 p-3 rounded-lg">
                  <Clock className="w-6 h-6 text-koi-teal" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Response Time</h3>
                  <p className="text-gray-600">
                    We typically respond to all inquiries within 24 hours during business days. For urgent matters, please include "URGENT" in your subject line.
                  </p>
                </div>
              </div>
            </div>

            {/* FAQ Suggestion */}
            <div className="bg-gradient-to-br from-koi-orange/10 to-koi-teal/10 rounded-lg p-8 border border-koi-orange/20">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Quick Help</h3>
              <p className="text-gray-700 mb-4">
                Looking for immediate answers? Check out these common topics:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li>• How to post a project or create a service</li>
                <li>• Payment and withdrawal information</li>
                <li>• Account verification process</li>
                <li>• Dispute resolution procedures</li>
              </ul>
              <p className="text-sm text-gray-600 mt-4">
                Most questions can be answered in our help documentation or by contacting support directly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
