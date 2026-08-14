import type { ReactNode } from "react";

export const metadata = {
  title: "Kin Form / Next.js SSR example",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif" }}>{children}</body>
    </html>
  );
}
