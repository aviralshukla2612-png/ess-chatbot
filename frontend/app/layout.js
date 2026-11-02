import Script from "next/script";
import "./globals.css";

export const metadata = {
  title: "Emperor Nexus — Premium AI Sales Assistant",
  description: "Autonomous enterprise sales and customer support AI assistant builder.",
  icons: {
    icon: "/e-logoicon.webp",
    shortcut: "/e-logoicon.webp",
    apple: "/e-logoicon.webp",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/e-logoicon.webp" type="image/webp" />
        <link rel="shortcut icon" href="/e-logoicon.webp" type="image/webp" />
        <link rel="apple-touch-icon" href="/e-logoicon.webp" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Syne:wght@600;700;800&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (stored === 'dark' || (!stored && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
