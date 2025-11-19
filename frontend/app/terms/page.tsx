import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';

export const dynamic = 'force-dynamic';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Header />

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-display font-bold text-midnight-navy mb-8">Terms & Conditions</h1>
        <p className="text-sm text-midnight-navy/60 mb-8">Last updated: January 2025</p>

        <div className="prose prose-lg max-w-none space-y-8 text-midnight-navy">
          <section>
            <h2 className="text-2xl font-display font-bold text-crimson mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing and using 1Kappa (&quot;the Platform&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-crimson mb-4">2. User Agreement</h2>
            <p className="mb-4">
              You must be at least 18 years old to use this Platform. By using 1Kappa, you represent and warrant that you are at least 18 years of age and have the legal capacity to enter into this agreement.
            </p>
            <p className="mb-4">
              You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-crimson mb-4">3. Marketplace Rules</h2>
            <p className="mb-4">
              1Kappa operates as a marketplace platform connecting verified Kappa Alpha Psi members (&quot;Sellers&quot;) with buyers. The Platform facilitates transactions but is not a party to any transaction between buyers and sellers.
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>All sellers must be verified members of Kappa Alpha Psi Fraternity, Inc.</li>
              <li>Products must be authentic and accurately described</li>
              <li>Sellers are responsible for their own product listings, pricing, and fulfillment</li>
              <li>Buyers are responsible for reviewing product details before purchase</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-crimson mb-4">4. Payment Terms</h2>
            <p className="mb-4">
              All payments are processed through Stripe, a third-party payment processor. By making a purchase, you agree to Stripe&apos;s terms of service and privacy policy.
            </p>
            <p className="mb-4">
              Prices are displayed in USD. All sales are final unless otherwise stated. Refunds and returns are subject to individual seller policies and applicable consumer protection laws.
            </p>
            <p className="mb-4">
              The Platform may collect transaction fees or commissions as disclosed at the time of sale. Revenue sharing with sponsoring chapters is handled according to our internal policies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-crimson mb-4">5. Seller Responsibilities</h2>
            <p className="mb-4">
              Sellers are responsible for:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Accurately describing products and setting appropriate prices</li>
              <li>Fulfilling orders in a timely manner</li>
              <li>Handling customer service inquiries and disputes</li>
              <li>Complying with all applicable laws and regulations</li>
              <li>Maintaining the confidentiality of their account credentials</li>
            </ul>
            <p className="mb-4">
              The Platform reserves the right to suspend or terminate seller accounts that violate these terms or engage in fraudulent activity.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-crimson mb-4">6. Intellectual Property</h2>
            <p className="mb-4">
              All content on the Platform, including but not limited to text, graphics, logos, images, and software, is the property of 1Kappa or its content suppliers and is protected by copyright, trademark, and other intellectual property laws.
            </p>
            <p className="mb-4">
              You may not reproduce, distribute, modify, create derivative works of, publicly display, or otherwise use any content from the Platform without prior written permission.
            </p>
            <p className="mb-4">
              The Platform is not affiliated with or endorsed by Kappa Alpha Psi Fraternity, Inc. All references to Kappa Alpha Psi are for identification purposes only.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-crimson mb-4">7. Prohibited Activities</h2>
            <p className="mb-4">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Use the Platform for any illegal or unauthorized purpose</li>
              <li>Violate any laws in your jurisdiction</li>
              <li>Infringe upon the rights of others</li>
              <li>Transmit any viruses, malware, or harmful code</li>
              <li>Attempt to gain unauthorized access to the Platform or its systems</li>
              <li>Interfere with or disrupt the Platform&apos;s operation</li>
              <li>Use automated systems to access the Platform without permission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-crimson mb-4">8. Limitation of Liability</h2>
            <p className="mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, 1KAPPA SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
            </p>
            <p className="mb-4">
              The Platform acts as an intermediary and is not responsible for the quality, safety, or legality of products sold by sellers, or the accuracy of product descriptions.
            </p>
            <p className="mb-4">
              Your sole remedy for dissatisfaction with the Platform is to stop using it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-crimson mb-4">9. Indemnification</h2>
            <p className="mb-4">
              You agree to indemnify, defend, and hold harmless 1Kappa, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising out of or relating to your use of the Platform, violation of these terms, or infringement of any rights of another.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-crimson mb-4">10. Modifications to Terms</h2>
            <p className="mb-4">
              We reserve the right to modify these terms at any time. We will notify users of any material changes by posting the new terms on this page and updating the &quot;Last updated&quot; date. Your continued use of the Platform after such modifications constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-crimson mb-4">11. Termination</h2>
            <p className="mb-4">
              We may terminate or suspend your account and access to the Platform immediately, without prior notice, for any reason, including breach of these terms. Upon termination, your right to use the Platform will cease immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-crimson mb-4">12. Governing Law</h2>
            <p className="mb-4">
              These terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions. Any disputes arising from these terms or your use of the Platform shall be resolved in the appropriate courts of the United States.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-crimson mb-4">13. Contact Information</h2>
            <p className="mb-4">
              If you have any questions about these Terms & Conditions, please contact us through the Platform&apos;s contact methods.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

