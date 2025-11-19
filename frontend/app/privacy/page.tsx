import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';

export const dynamic = 'force-dynamic';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Header />

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-display font-bold text-midnight-navy mb-8">Privacy Policy</h1>
        <p className="text-sm text-midnight-navy/60 mb-8">Last updated: January 2025</p>

        <div className="prose prose-lg max-w-none space-y-8 text-midnight-navy">
          <section>
            <h2 className="text-2xl font-display font-bold text-crimson mb-4">1. Introduction</h2>
            <p className="mb-4">
              At 1Kappa (&quot;we,&quot; &quot;our,&quot; or &quot;the Platform&quot;), we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our marketplace platform.
            </p>
            <p className="mb-4">
              Please read this Privacy Policy carefully. By using the Platform, you consent to the data practices described in this policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-crimson mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-display font-semibold text-midnight-navy mb-3 mt-6">2.1 Information You Provide</h3>
            <p className="mb-4">We collect information that you provide directly to us, including:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Account Information:</strong> Name, email address, phone number, and other registration details</li>
              <li><strong>Profile Information:</strong> Chapter affiliation, verification status, and profile details</li>
              <li><strong>Transaction Information:</strong> Purchase history, payment information, and shipping addresses</li>
              <li><strong>Seller Information:</strong> Product listings, descriptions, images, and pricing information</li>
              <li><strong>Communication:</strong> Messages, inquiries, and feedback you send to us or other users</li>
            </ul>

            <h3 className="text-xl font-display font-semibold text-midnight-navy mb-3 mt-6">2.2 Automatically Collected Information</h3>
            <p className="mb-4">When you use the Platform, we automatically collect certain information, including:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Device Information:</strong> IP address, browser type, operating system, and device identifiers</li>
              <li><strong>Usage Data:</strong> Pages visited, time spent on pages, links clicked, and search queries</li>
              <li><strong>Location Data:</strong> General location information based on IP address</li>
              <li><strong>Cookies and Tracking:</strong> Information collected through cookies, web beacons, and similar technologies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-crimson mb-4">3. How We Use Your Information</h2>
            <p className="mb-4">We use the information we collect for various purposes, including:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Providing, maintaining, and improving the Platform</li>
              <li>Processing transactions and managing your account</li>
              <li>Verifying user identity and chapter affiliation</li>
              <li>Facilitating communication between buyers and sellers</li>
              <li>Sending transaction confirmations, updates, and customer service messages</li>
              <li>Personalizing your experience and showing relevant content</li>
              <li>Detecting, preventing, and addressing fraud, security, or technical issues</li>
              <li>Complying with legal obligations and enforcing our terms</li>
              <li>Sending marketing communications (with your consent, where required)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-crimson mb-4">4. Third-Party Services</h2>
            
            <h3 className="text-xl font-display font-semibold text-midnight-navy mb-3 mt-6">4.1 Payment Processing</h3>
            <p className="mb-4">
              We use Stripe, a third-party payment processor, to handle all payment transactions. When you make a purchase, your payment information is processed directly by Stripe. We do not store your full credit card details on our servers.
            </p>
            <p className="mb-4">
              Stripe&apos;s collection and use of your information is governed by their Privacy Policy. We encourage you to review Stripe&apos;s privacy practices at{' '}
              <a 
                href="https://stripe.com/privacy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-crimson hover:text-aurora-gold hover:underline"
              >
                https://stripe.com/privacy
              </a>.
            </p>

            <h3 className="text-xl font-display font-semibold text-midnight-navy mb-3 mt-6">4.2 Other Third-Party Services</h3>
            <p className="mb-4">
              We may use other third-party services for analytics, hosting, email delivery, and other functions. These services may have access to your information as necessary to perform their functions, but they are prohibited from using it for other purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-crimson mb-4">5. Information Sharing and Disclosure</h2>
            <p className="mb-4">We may share your information in the following circumstances:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>With Sellers/Buyers:</strong> When you make a purchase, we share necessary information (name, shipping address) with the seller to fulfill your order</li>
              <li><strong>Service Providers:</strong> With third-party vendors who perform services on our behalf (payment processing, hosting, analytics)</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or government regulation</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              <li><strong>With Your Consent:</strong> When you explicitly authorize us to share your information</li>
              <li><strong>To Protect Rights:</strong> To protect our rights, property, or safety, or that of our users or others</li>
            </ul>
            <p className="mb-4">
              We do not sell your personal information to third parties for their marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-crimson mb-4">6. Cookies and Tracking Technologies</h2>
            <p className="mb-4">
              We use cookies and similar tracking technologies to collect and store information about your preferences and activity on the Platform. Cookies are small data files stored on your device.
            </p>
            <p className="mb-4">We use cookies for:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Authentication and session management</li>
              <li>Remembering your preferences and settings</li>
              <li>Analyzing usage patterns and improving the Platform</li>
              <li>Providing personalized content and advertisements</li>
            </ul>
            <p className="mb-4">
              You can control cookies through your browser settings. However, disabling cookies may limit your ability to use certain features of the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-crimson mb-4">7. Data Security</h2>
            <p className="mb-4">
              We implement appropriate technical and organizational security measures to protect your information against unauthorized access, alteration, disclosure, or destruction. These measures include encryption, secure servers, and access controls.
            </p>
            <p className="mb-4">
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-crimson mb-4">8. Your Rights and Choices</h2>
            <p className="mb-4">Depending on your location, you may have certain rights regarding your personal information:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Access:</strong> Request access to your personal information</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
              <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Account Management:</strong> Update or delete your account through your account settings</li>
            </ul>
            <p className="mb-4">
              To exercise these rights, please contact us through the Platform&apos;s contact methods. We will respond to your request within a reasonable timeframe.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-crimson mb-4">9. Children&apos;s Privacy</h2>
            <p className="mb-4">
              The Platform is not intended for individuals under the age of 18. We do not knowingly collect personal information from children under 18. If we become aware that we have collected information from a child under 18, we will take steps to delete such information promptly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-crimson mb-4">10. Data Retention</h2>
            <p className="mb-4">
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When we no longer need your information, we will securely delete or anonymize it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-crimson mb-4">11. International Data Transfers</h2>
            <p className="mb-4">
              Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that differ from those in your country. By using the Platform, you consent to the transfer of your information to these countries.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-crimson mb-4">12. Changes to This Privacy Policy</h2>
            <p className="mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. We encourage you to review this Privacy Policy periodically.
            </p>
            <p className="mb-4">
              Your continued use of the Platform after any changes to this Privacy Policy constitutes acceptance of those changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-crimson mb-4">13. Contact Information</h2>
            <p className="mb-4">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us through the Platform&apos;s contact methods.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

