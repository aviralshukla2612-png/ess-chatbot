import Script from "next/script";
import "./globals.css";

export const metadata = {
  title: "Emperor Nexus — Premium AI Sales Assistant",
  description: "Autonomous enterprise sales and customer support AI assistant builder.",
  icons: {
    icon: "/emperor_nexus_sales_ai_assistant.png",
    shortcut: "/emperor_nexus_sales_ai_assistant.png",
    apple: "/emperor_nexus_sales_ai_assistant.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className="dark h-full antialiased"
      style={{ colorScheme: "dark", backgroundColor: "#050507" }}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/emperor_nexus_sales_ai_assistant.png" type="image/png" />
        <link rel="shortcut icon" href="/emperor_nexus_sales_ai_assistant.png" type="image/png" />
        <link rel="apple-touch-icon" href="/emperor_nexus_sales_ai_assistant.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Syne:wght@600;700;800&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  document.documentElement.classList.add('dark');
                  document.documentElement.style.colorScheme = 'dark';
                  document.documentElement.style.backgroundColor = '#050507';
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#050507] text-[#F5F5F7]">
        {children}
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
