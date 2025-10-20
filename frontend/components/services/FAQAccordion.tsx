'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronDown, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FAQ {
  question: string
  answer: string
}

interface FAQAccordionProps {
  faqs: FAQ[]
  maxVisible?: number
  className?: string
}

export function FAQAccordion({ faqs, maxVisible, className }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const displayFaqs = maxVisible ? faqs.slice(0, maxVisible) : faqs

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  if (faqs.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 mb-2">No FAQ available</h3>
            <p className="text-gray-600 text-sm">
              Contact the seller if you have any questions.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5" />
          Frequently Asked Questions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayFaqs.map((faq, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg overflow-hidden transition-all"
          >
            {/* Question Header */}
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              aria-expanded={openIndex === index}
            >
              <h4 className="font-medium text-gray-900 pr-4">{faq.question}</h4>
              <ChevronDown
                className={cn(
                  "w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-200",
                  openIndex === index && "transform rotate-180"
                )}
              />
            </button>

            {/* Answer Content */}
            <div
              className={cn(
                "overflow-hidden transition-all duration-200 ease-in-out",
                openIndex === index ? "max-h-96" : "max-h-0"
              )}
            >
              <div className="px-4 pb-4 pt-0">
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                  {faq.answer}
                </p>
              </div>
            </div>
          </div>
        ))}

        {maxVisible && faqs.length > maxVisible && (
          <p className="text-sm text-gray-600 text-center pt-2">
            {faqs.length - maxVisible} more FAQ{faqs.length - maxVisible !== 1 ? 's' : ''} available
          </p>
        )}
      </CardContent>
    </Card>
  )
}
