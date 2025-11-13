'use client'

import { Button } from '@/components/ui/button'
import { X, DollarSign, AlertTriangle, Shield } from 'lucide-react'

interface PaymentRequiredModalProps {
  isOpen: boolean
  onClose: () => void
  onProceedToPayment: () => void
  totalCharged: number
  agreedAmount: number
  buyerFee: number
  projectTitle: string
}

export function PaymentRequiredModal({
  isOpen,
  onClose,
  onProceedToPayment,
  totalCharged,
  agreedAmount,
  buyerFee,
  projectTitle
}: PaymentRequiredModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Payment Required</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Warning Message */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-gray-800 text-sm leading-relaxed">
              You must fund the project escrow <strong>before approving the freelancer's work</strong>.
              This ensures secure payment processing and protects both parties.
            </p>
          </div>

          {/* Project Info */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Project</h3>
            <p className="text-gray-900 font-medium">{projectTitle}</p>
          </div>

          {/* Payment Breakdown */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-600" />
              Escrow Payment Breakdown
            </h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Agreed Amount</span>
                <span className="font-medium text-gray-900">
                  ${agreedAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Buyer Service Fee (2.5%)</span>
                <span className="font-medium text-gray-900">
                  ${buyerFee.toFixed(2)}
                </span>
              </div>
              <div className="border-t border-gray-300 pt-2 flex justify-between">
                <span className="font-semibold text-gray-900">Total to Pay</span>
                <span className="font-bold text-xl text-green-600">
                  ${totalCharged.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                Funds are held securely in escrow until you approve the completed work.
                The freelancer receives payment only after your approval.
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900">How Escrow Works:</h3>
            <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
              <li>You fund the escrow with the total amount</li>
              <li>Funds are held securely until work is approved</li>
              <li>You review and approve the completed work</li>
              <li>Payment is automatically released to the freelancer</li>
            </ol>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 bg-gray-50 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={onProceedToPayment}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Fund Escrow (${totalCharged.toFixed(2)})
          </Button>
        </div>
      </div>
    </div>
  )
}
