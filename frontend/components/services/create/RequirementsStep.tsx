'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Minus, HelpCircle } from 'lucide-react'
import { CreateServiceData, ServiceFAQ } from '@/lib/api/services'

interface RequirementsStepProps {
  formData: CreateServiceData
  updateFormData: (updates: Partial<CreateServiceData>) => void
}

export default function RequirementsStep({
  formData,
  updateFormData
}: RequirementsStepProps) {
  const [newFAQ, setNewFAQ] = useState({ question: '', answer: '' })

  const addFAQ = () => {
    if (newFAQ.question.trim() && newFAQ.answer.trim()) {
      const currentFAQs = formData.faqs || []
      updateFormData({
        faqs: [...currentFAQs, { ...newFAQ }]
      })
      setNewFAQ({ question: '', answer: '' })
    }
  }

  const removeFAQ = (index: number) => {
    const currentFAQs = formData.faqs || []
    updateFormData({
      faqs: currentFAQs.filter((_, i) => i !== index)
    })
  }

  const updateFAQ = (index: number, field: 'question' | 'answer', value: string) => {
    const currentFAQs = formData.faqs || []
    const updatedFAQs = [...currentFAQs]
    updatedFAQs[index] = { ...updatedFAQs[index], [field]: value }
    updateFormData({ faqs: updatedFAQs })
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold mb-2">Requirements & FAQ</h2>
        <p className="text-gray-600">
          Help clients understand what you need from them and answer common questions
        </p>
      </div>

      {/* Requirements */}
      <div>
        <Label htmlFor="requirements">Requirements from Client</Label>
        <p className="text-sm text-gray-600 mb-3">
          What information, files, or materials do you need from the client to complete this service?
        </p>
        <Textarea
          id="requirements"
          value={formData.requirements || ''}
          onChange={(e) => updateFormData({ requirements: e.target.value })}
          placeholder="Example: Please provide your company logo, brand colors, and any specific design preferences. Include any text content you want in the design."
          rows={6}
          maxLength={2000}
        />
        <p className="text-sm text-gray-500 mt-1">
          {(formData.requirements || '').length}/2000 characters (optional)
        </p>
      </div>

      {/* FAQ Section */}
      <div>
        <Label>Frequently Asked Questions</Label>
        <p className="text-sm text-gray-600 mb-4">
          Add common questions and answers to help clients understand your service better
        </p>

        {/* Existing FAQs */}
        {formData.faqs && formData.faqs.length > 0 && (
          <div className="space-y-4 mb-6">
            {formData.faqs.map((faq, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div>
                          <Label htmlFor={`faq-question-${index}`}>Question</Label>
                          <Input
                            id={`faq-question-${index}`}
                            value={faq.question}
                            onChange={(e) => updateFAQ(index, 'question', e.target.value)}
                            placeholder="What's your typical turnaround time?"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`faq-answer-${index}`}>Answer</Label>
                          <Textarea
                            id={`faq-answer-${index}`}
                            value={faq.answer}
                            onChange={(e) => updateFAQ(index, 'answer', e.target.value)}
                            placeholder="My typical turnaround time is 3-5 business days, depending on the complexity of the project."
                            rows={3}
                          />
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFAQ(index)}
                        className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add New FAQ */}
        <Card className="border-dashed border-2 border-gray-300">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <HelpCircle className="w-5 h-5 mr-2" />
              Add New FAQ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="new-faq-question">Question</Label>
              <Input
                id="new-faq-question"
                value={newFAQ.question}
                onChange={(e) => setNewFAQ(prev => ({ ...prev, question: e.target.value }))}
                placeholder="What would clients commonly ask about this service?"
                maxLength={200}
              />
            </div>

            <div>
              <Label htmlFor="new-faq-answer">Answer</Label>
              <Textarea
                id="new-faq-answer"
                value={newFAQ.answer}
                onChange={(e) => setNewFAQ(prev => ({ ...prev, answer: e.target.value }))}
                placeholder="Provide a clear, helpful answer"
                rows={3}
                maxLength={1000}
              />
            </div>

            <Button
              onClick={addFAQ}
              disabled={!newFAQ.question.trim() || !newFAQ.answer.trim()}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add FAQ
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Common FAQ Suggestions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-medium text-yellow-900 mb-2">💡 Common FAQ Suggestions</h3>
        <div className="text-sm text-yellow-800 space-y-1">
          <p><strong>Suggested questions to consider:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>What's your typical turnaround time?</li>
            <li>How many revisions are included?</li>
            <li>What file formats will I receive?</li>
            <li>Do you provide source files?</li>
            <li>Can you work with my existing brand guidelines?</li>
            <li>What happens if I'm not satisfied?</li>
            <li>Do you offer rush delivery?</li>
            <li>Can I request additional revisions after completion?</li>
          </ul>
        </div>
      </div>

      {/* Requirements Examples */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">📋 Requirements Examples</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>Good requirements examples:</strong></p>
          <div className="bg-white p-3 rounded border border-blue-200">
            <p className="font-medium mb-1">Logo Design:</p>
            <p className="italic">
              "Please provide your company name, industry, target audience, preferred colors,
              and any specific style preferences. If you have existing branding materials,
              please share them for reference."
            </p>
          </div>
          <div className="bg-white p-3 rounded border border-blue-200">
            <p className="font-medium mb-1">Website Development:</p>
            <p className="italic">
              "Please provide your website content, preferred color scheme, any design
              inspiration, and your hosting details. I'll also need access to your domain
              registrar if needed."
            </p>
          </div>
        </div>
      </div>

      {/* Summary */}
      {(formData.requirements || (formData.faqs && formData.faqs.length > 0)) && (
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Requirements specified:</span>
                <span className={formData.requirements ? 'text-green-600' : 'text-gray-500'}>
                  {formData.requirements ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>FAQs added:</span>
                <span className={(formData.faqs?.length || 0) > 0 ? 'text-green-600' : 'text-gray-500'}>
                  {formData.faqs?.length || 0} FAQ{(formData.faqs?.length || 0) !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}