import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Cookie Policy | BookaMOT',
  description: 'Cookie Policy for the BookaMOT MOT booking platform. Learn about the cookies we use and how to manage them.',
};

export default function CookiesPage() {
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
        <h1 className="text-4xl font-bold text-foreground mb-8">Cookie Policy</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-muted-foreground mb-6">
            <strong>Last updated:</strong> December 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. What Are Cookies?</h2>
            <p className="text-muted-foreground mb-4">
              Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work more efficiently and to provide information to website owners.
            </p>
            <p className="text-muted-foreground mb-4">
              This Cookie Policy explains how BookaMOT (bookamot.co.uk) uses cookies and similar technologies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Types of Cookies We Use</h2>
            
            <h3 className="text-xl font-medium text-foreground mb-3">Essential Cookies</h3>
            <p className="text-muted-foreground mb-4">
              These cookies are necessary for the website to function properly. They enable core functionality such as:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>User authentication and session management</li>
              <li>Security features</li>
              <li>Remembering your preferences</li>
              <li>Shopping cart functionality</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3">Performance Cookies</h3>
            <p className="text-muted-foreground mb-4">
              These cookies help us understand how visitors interact with our website by collecting anonymous information:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Pages visited and time spent</li>
              <li>Error messages encountered</li>
              <li>Website performance metrics</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3">Functional Cookies</h3>
            <p className="text-muted-foreground mb-4">
              These cookies enable enhanced functionality and personalization:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Remembering your login details</li>
              <li>Storing your location preferences</li>
              <li>Customizing the website appearance (e.g., dark mode)</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3">Marketing Cookies</h3>
            <p className="text-muted-foreground mb-4">
              These cookies may be set by our advertising partners to build a profile of your interests:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Tracking across websites for targeted advertising</li>
              <li>Measuring the effectiveness of advertising campaigns</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. Cookies We Use</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left text-foreground">Cookie Name</th>
                    <th className="px-4 py-2 text-left text-foreground">Purpose</th>
                    <th className="px-4 py-2 text-left text-foreground">Duration</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-t border-border">
                    <td className="px-4 py-2">next-auth.session-token</td>
                    <td className="px-4 py-2">User authentication</td>
                    <td className="px-4 py-2">Session</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="px-4 py-2">next-auth.csrf-token</td>
                    <td className="px-4 py-2">Security (CSRF protection)</td>
                    <td className="px-4 py-2">Session</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="px-4 py-2">theme</td>
                    <td className="px-4 py-2">Dark/light mode preference</td>
                    <td className="px-4 py-2">1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Managing Cookies</h2>
            <p className="text-muted-foreground mb-4">
              You can control and manage cookies in various ways:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Browser Settings:</strong> Most browsers allow you to refuse or delete cookies through their settings</li>
              <li><strong>Third-Party Tools:</strong> Various opt-out tools are available for advertising cookies</li>
              <li><strong>Our Website:</strong> You can adjust your cookie preferences when you first visit our site</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Please note that disabling certain cookies may affect the functionality of our website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Contact Us</h2>
            <p className="text-muted-foreground mb-4">
              If you have any questions about our use of cookies, please contact us at:
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
            <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link>
            <span>•</span>
            <Link href="/" className="hover:text-primary">Home</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

