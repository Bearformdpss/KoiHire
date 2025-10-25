export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-koi-orange to-koi-teal text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-xl text-white/90">
            Last updated: January 25, 2025
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-8 md:p-12 prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              KoiHire ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our freelance marketplace platform at koihire.com (the "Platform").
            </p>
            <p className="text-gray-700">
              By using the Platform, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with this policy, please do not access or use the Platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1 Personal Information</h3>
            <p className="text-gray-700 mb-3">We collect personal information that you provide directly to us, including:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              <li>Name, email address, username, and password</li>
              <li>Profile information (bio, location, skills, portfolio)</li>
              <li>Payment information (processed securely through Stripe)</li>
              <li>Communication data (messages, project proposals, reviews)</li>
              <li>Profile photo and uploaded files</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.2 Automatically Collected Information</h3>
            <p className="text-gray-700 mb-3">When you use the Platform, we automatically collect:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              <li>Device information (IP address, browser type, operating system)</li>
              <li>Usage data (pages visited, time spent, features used)</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 mb-3">We use your information to:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              <li>Provide, maintain, and improve the Platform</li>
              <li>Process transactions and send transaction notifications</li>
              <li>Facilitate communication between clients and freelancers</li>
              <li>Send administrative information, updates, and security alerts</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Detect, prevent, and address fraud, security, or technical issues</li>
              <li>Comply with legal obligations</li>
              <li>Improve user experience through analytics</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 With Other Users</h3>
            <p className="text-gray-700 mb-4">
              Your profile information, portfolio, and public reviews are visible to other users of the Platform. When you engage in a project or service transaction, relevant information is shared between you and the other party.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 With Service Providers</h3>
            <p className="text-gray-700 mb-4">
              We share information with third-party service providers who perform services on our behalf, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              <li>Payment processing (Stripe)</li>
              <li>Cloud hosting services (Railway, Vercel)</li>
              <li>Email delivery services</li>
              <li>Analytics providers</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.3 Legal Requirements</h3>
            <p className="text-gray-700 mb-4">
              We may disclose your information if required by law or in response to valid requests by public authorities (e.g., court orders, subpoenas).
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.4 Business Transfers</h3>
            <p className="text-gray-700 mb-4">
              In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
            <p className="text-gray-700 mb-4">
              We implement appropriate technical and organizational security measures to protect your personal information, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure authentication and authorization</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and monitoring</li>
            </ul>
            <p className="text-gray-700">
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Rights and Choices</h2>
            <p className="text-gray-700 mb-3">You have the following rights regarding your personal information:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              <li><strong>Access:</strong> Request access to your personal information</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
            </ul>
            <p className="text-gray-700">
              To exercise these rights, please contact us at support@koihire.com.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cookies and Tracking</h2>
            <p className="text-gray-700 mb-4">
              We use cookies and similar tracking technologies to enhance your experience, analyze usage, and deliver personalized content. You can control cookies through your browser settings, but disabling cookies may affect Platform functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Data Retention</h2>
            <p className="text-gray-700 mb-4">
              We retain your personal information for as long as necessary to provide our services and comply with legal obligations. When you close your account, we may retain certain information for legitimate business purposes or as required by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Children's Privacy</h2>
            <p className="text-gray-700 mb-4">
              The Platform is not intended for users under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected information from a child, we will take steps to delete it promptly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. International Data Transfers</h2>
            <p className="text-gray-700 mb-4">
              Your information may be transferred to and processed in countries other than your own. We ensure that appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. Your continued use of the Platform after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong> support@koihire.com<br />
                <strong>Website:</strong> koihire.com/contact
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
