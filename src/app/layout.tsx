import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import AuthSessionProvider from "@/components/providers/session-provider"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { VersionCheckProvider } from "@/components/providers/version-check-provider"
import { UpdateNotification } from "@/components/ui/update-notification"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "BookaMOT - Online MOT Booking System",
  description: "Book your MOT test online with DVSA approved garages. Quick, easy, and secure.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const isProd = process.env.NODE_ENV === "production"

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          <AuthSessionProvider>
            {isProd ? (
              <VersionCheckProvider>
                {children}
                <UpdateNotification />
              </VersionCheckProvider>
            ) : (
              <>{children}</>
            )}
          </AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
