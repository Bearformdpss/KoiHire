export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-koi-orange to-koi-teal py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-koi-navy">Terms of Service</h1>
          <p className="text-xl text-koi-navy">
            Last updated: January 25, 2025
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-8 md:p-12 prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 mb-4">
              Welcome to KoiHire. By accessing or using our Platform at koihire.com ("Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Platform.
            </p>
            <p className="text-gray-700">
              These Terms constitute a legally binding agreement between you and KoiHire ("we," "our," or "us"). We reserve the right to modify these Terms at any time, and your continued use of the Platform after changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Eligibility</h2>
            <p className="text-gray-700 mb-4">
              You must be at least 18 years old to use the Platform. By using the Platform, you represent and warrant that:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              <li>You are at least 18 years of age</li>
              <li>You have the legal capacity to enter into binding contracts</li>
              <li>You will provide accurate and complete information</li>
              <li>You will comply with all applicable laws and regulations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.1 Account Creation</h3>
            <p className="text-gray-700 mb-4">
              To use certain features of the Platform, you must create an account. You agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and update your information to keep it accurate</li>
              <li>Keep your password secure and confidential</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.2 Account Types</h3>
            <p className="text-gray-700 mb-4">
              The Platform offers two types of accounts:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              <li><strong>Client Accounts:</strong> For posting projects and purchasing services</li>
              <li><strong>Freelancer Accounts:</strong> For bidding on projects and offering services</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.3 Account Suspension and Termination</h3>
            <p className="text-gray-700 mb-4">
              We reserve the right to suspend or terminate your account at any time for violation of these Terms, fraudulent activity, or any other reason at our sole discretion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Platform Services</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 Marketplace Services</h3>
            <p className="text-gray-700 mb-4">
              KoiHire provides a platform that connects clients with freelancers for project-based work and service listings. We facilitate:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              <li>Project posting and bidding</li>
              <li>Service listing and purchasing</li>
              <li>Communication between parties</li>
              <li>Payment processing and escrow services</li>
              <li>Dispute resolution</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 Platform Role</h3>
            <p className="text-gray-700 mb-4">
              KoiHire acts as a platform provider and intermediary. We do not:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              <li>Employ freelancers or act as their employer</li>
              <li>Control the quality, timing, or legality of services provided</li>
              <li>Guarantee the accuracy of user profiles or listings</li>
              <li>Guarantee successful project completion</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Fees and Payments</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.1 Service Fees</h3>
            <p className="text-gray-700 mb-4">
              KoiHire charges service fees on transactions completed through the Platform. Fees are clearly disclosed at the time of transaction and may vary based on:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              <li>Transaction type (project or service)</li>
              <li>Transaction amount</li>
              <li>User membership level</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.2 Payment Processing</h3>
            <p className="text-gray-700 mb-4">
              All payments are processed securely through Stripe. By using the Platform, you agree to Stripe's terms and conditions. KoiHire does not store your payment card information.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.3 Escrow and Payouts</h3>
            <p className="text-gray-700 mb-4">
              For project-based work, funds are held in escrow until project completion. Freelancer payouts are subject to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              <li>Successful project delivery and client approval</li>
              <li>Completion of any applicable review periods</li>
              <li>Compliance with applicable tax regulations</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.4 Refunds</h3>
            <p className="text-gray-700 mb-4">
              Refund policies vary by transaction type. Service purchases may have specific refund terms outlined in the service listing. Project-based refunds are handled through our dispute resolution process.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. User Conduct</h2>
            <p className="text-gray-700 mb-3">You agree not to:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              <li>Violate any laws, regulations, or third-party rights</li>
              <li>Post false, misleading, or fraudulent content</li>
              <li>Engage in harassment, abuse, or threatening behavior</li>
              <li>Attempt to circumvent Platform fees or payment systems</li>
              <li>Create multiple accounts to manipulate ratings or reviews</li>
              <li>Share account credentials with others</li>
              <li>Use automated tools to access or scrape the Platform</li>
              <li>Infringe on intellectual property rights</li>
              <li>Transmit viruses, malware, or harmful code</li>
              <li>Interfere with Platform operations or security</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Content and Intellectual Property</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">7.1 User Content</h3>
            <p className="text-gray-700 mb-4">
              You retain ownership of content you submit to the Platform (profiles, portfolios, project descriptions, etc.). By submitting content, you grant KoiHire a worldwide, non-exclusive, royalty-free license to use, display, and distribute your content for Platform operations.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">7.2 Platform Content</h3>
            <p className="text-gray-700 mb-4">
              The Platform and its content (design, logos, software, text, graphics) are owned by KoiHire and protected by copyright, trademark, and other intellectual property laws.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">7.3 Project Work Product</h3>
            <p className="text-gray-700 mb-4">
              Ownership of work product created through Platform projects is governed by the agreement between client and freelancer. We recommend establishing clear terms before starting work.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Dispute Resolution</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">8.1 Platform Mediation</h3>
            <p className="text-gray-700 mb-4">
              If disputes arise between users, we offer a dispute resolution process. Both parties agree to cooperate and provide requested information during the resolution process.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">8.2 Binding Arbitration</h3>
            <p className="text-gray-700 mb-4">
              Any disputes between you and KoiHire will be resolved through binding arbitration rather than in court, except where prohibited by law. You waive your right to participate in class action lawsuits.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Disclaimers and Limitation of Liability</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">9.1 Platform "As Is"</h3>
            <p className="text-gray-700 mb-4">
              The Platform is provided "as is" without warranties of any kind, express or implied. We do not guarantee uninterrupted, error-free, or secure access.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">9.2 Limitation of Liability</h3>
            <p className="text-gray-700 mb-4">
              To the fullest extent permitted by law, KoiHire shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">9.3 User Responsibility</h3>
            <p className="text-gray-700 mb-4">
              You acknowledge that KoiHire is not responsible for the conduct of users, quality of work, payment disputes between users, or any damages resulting from user interactions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Indemnification</h2>
            <p className="text-gray-700 mb-4">
              You agree to indemnify and hold harmless KoiHire from any claims, damages, losses, liabilities, and expenses arising from:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              <li>Your use of the Platform</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any rights of another party</li>
              <li>Your content or conduct on the Platform</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Termination</h2>
            <p className="text-gray-700 mb-4">
              You may terminate your account at any time through account settings. We may terminate or suspend your account immediately for violations of these Terms. Upon termination:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              <li>Your right to use the Platform ceases immediately</li>
              <li>Outstanding obligations remain in effect</li>
              <li>We may delete your account data subject to legal retention requirements</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. General Provisions</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">12.1 Governing Law</h3>
            <p className="text-gray-700 mb-4">
              These Terms are governed by the laws of the United States, without regard to conflict of law principles.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">12.2 Severability</h3>
            <p className="text-gray-700 mb-4">
              If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full effect.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">12.3 Entire Agreement</h3>
            <p className="text-gray-700 mb-4">
              These Terms, along with our Privacy Policy, constitute the entire agreement between you and KoiHire regarding the Platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              For questions about these Terms, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong> support@koihire.com<br />
                <strong>Website:</strong> koihire.com/contact
              </p>
            </div>
          </section>

          <div className="bg-koi-orange/10 border-l-4 border-koi-orange p-6 mt-8">
            <p className="text-gray-800 font-semibold">
              By using KoiHire, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
