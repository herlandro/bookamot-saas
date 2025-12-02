import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Privacy Policy | BookaMOT',
  description: 'Privacy Policy for the BookaMOT MOT booking platform. Learn how we collect, use, and protect your personal data.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">BookaMOT</span>
            </Link>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-foreground mb-8">Privacy Policy</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-muted-foreground mb-6">
            <strong>Last updated:</strong> December 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Introduction</h2>
            <p className="text-muted-foreground mb-4">
              BookaMOT ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website bookamot.co.uk and our MOT booking services.
            </p>
            <p className="text-muted-foreground mb-4">
              We comply with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Information We Collect</h2>
            <h3 className="text-xl font-medium text-foreground mb-3">Personal Information</h3>
            <p className="text-muted-foreground mb-4">When you create an account or make a booking, we may collect:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Name and contact details (email, phone number)</li>
              <li>Vehicle registration number</li>
              <li>Vehicle make, model, and year</li>
              <li>MOT history and due dates</li>
              <li>Booking history and preferences</li>
              <li>Payment information (processed securely by third-party providers)</li>
            </ul>
            <h3 className="text-xl font-medium text-foreground mb-3">Automatically Collected Information</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>IP address and browser type</li>
              <li>Device information</li>
              <li>Usage data and browsing patterns</li>
              <li>Cookies and similar technologies (see our Cookie Policy)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Process and manage your MOT bookings</li>
              <li>Send booking confirmations and reminders</li>
              <li>Notify you when your MOT is due</li>
              <li>Provide customer support</li>
              <li>Improve our services and user experience</li>
              <li>Comply with legal obligations</li>
              <li>Send marketing communications (with your consent)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Information Sharing</h2>
            <p className="text-muted-foreground mb-4">We may share your information with:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Garages:</strong> To facilitate your MOT booking</li>
              <li><strong>Service Providers:</strong> Who assist in operating our platform</li>
              <li><strong>Legal Authorities:</strong> When required by law</li>
              <li><strong>DVSA:</strong> For verification of MOT testing information</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Data Security</h2>
            <p className="text-muted-foreground mb-4">
              We implement appropriate technical and organizational measures to protect your personal data, including:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure password hashing</li>
              <li>Regular security assessments</li>
              <li>Access controls and authentication</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Your Rights</h2>
            <p className="text-muted-foreground mb-4">Under UK GDPR, you have the right to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Access your personal data</li>
              <li>Rectify inaccurate data</li>
              <li>Request erasure of your data</li>
              <li>Restrict processing of your data</li>
              <li>Data portability</li>
              <li>Object to processing</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Data Retention</h2>
            <p className="text-muted-foreground mb-4">
              We retain your personal data for as long as necessary to provide our services and comply with legal obligations. Booking records are typically retained for 7 years for legal and regulatory purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Contact Us</h2>
            <p className="text-muted-foreground mb-4">
              For any questions about this Privacy Policy or to exercise your rights, contact us at:
            </p>
            <p className="text-muted-foreground">
              Email: privacy@bookamot.co.uk<br />
              Website: bookamot.co.uk
            </p>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link href="/terms" className="hover:text-primary">Terms and Conditions</Link>
            <span>•</span>
            <Link href="/cookies" className="hover:text-primary">Cookie Policy</Link>
            <span>•</span>
            <Link href="/" className="hover:text-primary">Home</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

