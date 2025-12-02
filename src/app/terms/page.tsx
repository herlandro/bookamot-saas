import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Terms and Conditions | BookaMOT',
  description: 'Terms and Conditions for using the BookaMOT MOT booking platform.',
};

export default function TermsPage() {
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
        <h1 className="text-4xl font-bold text-foreground mb-8">Terms and Conditions</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-muted-foreground mb-6">
            <strong>Last updated:</strong> December 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Introduction</h2>
            <p className="text-muted-foreground mb-4">
              Welcome to BookaMOT. These terms and conditions outline the rules and regulations for the use of the BookaMOT website and services, located at bookamot.co.uk.
            </p>
            <p className="text-muted-foreground mb-4">
              By accessing this website and using our services, you accept these terms and conditions in full. If you disagree with any part of these terms and conditions, you must not use our website or services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Definitions</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>"BookaMOT"</strong>, <strong>"we"</strong>, <strong>"us"</strong>, or <strong>"our"</strong> refers to BookaMOT, the operator of the bookamot.co.uk website.</li>
              <li><strong>"Customer"</strong> or <strong>"you"</strong> refers to any individual or entity using our platform to book MOT tests.</li>
              <li><strong>"Garage"</strong> or <strong>"Service Provider"</strong> refers to any MOT testing station registered on our platform.</li>
              <li><strong>"Booking"</strong> refers to any MOT test appointment made through our platform.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. Our Services</h2>
            <p className="text-muted-foreground mb-4">
              BookaMOT provides an online platform that connects vehicle owners with DVSA-approved MOT testing stations. Our services include:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Searching for MOT testing stations by location</li>
              <li>Comparing prices and availability</li>
              <li>Booking MOT tests online</li>
              <li>Managing vehicle information and MOT history</li>
              <li>Receiving MOT reminders and notifications</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. User Accounts</h2>
            <p className="text-muted-foreground mb-4">
              To use certain features of our platform, you must create an account. You are responsible for:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Providing accurate and complete registration information</li>
              <li>Maintaining the security of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Bookings and Cancellations</h2>
            <p className="text-muted-foreground mb-4">
              When you make a booking through BookaMOT:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>You enter into a contract with the garage, not with BookaMOT</li>
              <li>You must arrive on time for your appointment</li>
              <li>Cancellation policies are set by individual garages</li>
              <li>BookaMOT is not liable for services provided by garages</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Garage Responsibilities</h2>
            <p className="text-muted-foreground mb-4">
              Garages registered on our platform agree to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Maintain valid DVSA approval for MOT testing</li>
              <li>Provide accurate pricing and availability information</li>
              <li>Honor bookings made through our platform</li>
              <li>Conduct MOT tests in accordance with DVSA standards</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Limitation of Liability</h2>
            <p className="text-muted-foreground mb-4">
              BookaMOT acts as an intermediary platform. We are not responsible for:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>The quality of MOT tests conducted by garages</li>
              <li>Any disputes between customers and garages</li>
              <li>Any loss or damage arising from the use of our services</li>
              <li>Technical issues beyond our reasonable control</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Intellectual Property</h2>
            <p className="text-muted-foreground mb-4">
              All content on bookamot.co.uk, including text, graphics, logos, and software, is the property of BookaMOT and is protected by UK and international copyright laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Changes to Terms</h2>
            <p className="text-muted-foreground mb-4">
              We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting on our website. Your continued use of our services constitutes acceptance of the modified terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. Contact Us</h2>
            <p className="text-muted-foreground mb-4">
              If you have any questions about these Terms and Conditions, please contact us at:
            </p>
            <p className="text-muted-foreground">
              Email: support@bookamot.co.uk<br />
              Website: bookamot.co.uk
            </p>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link>
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

