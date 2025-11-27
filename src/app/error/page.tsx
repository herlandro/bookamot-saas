'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield } from 'lucide-react';
import Link from 'next/link';

function ErrorPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorMessage = searchParams.get('error');
    setError(errorMessage);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="flex items-center">
              <Shield className="h-12 w-12 text-primary mr-3" />
              <h1 className="text-3xl font-bold text-foreground">BookaMOT</h1>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Authentication Error
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            There was a problem with your authentication.
          </p>
        </div>
        <div className="bg-card py-8 px-6 shadow-xl rounded-lg border border-border">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm mb-6">
              {error}
            </div>
          )}
          <div className="text-center">
            <p className="text-muted-foreground mb-6">
              Please try again or contact support if the problem persists.
            </p>
            <div className="flex flex-col space-y-4">
              <Link
                href="/signin"
                className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Return to Sign In
              </Link>
              <Link
                href="/"
                className="w-full inline-flex justify-center py-2 px-4 border border-border rounded-md shadow-sm text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
              >
                Go to Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }
    >
      <ErrorPageContent />
    </Suspense>
  );
}
