import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "AutoClip & Flow AI",
  description: "AI workflow automation and short-form video repurposing studio"
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
