import '../index.css';
import { Metadata } from 'next';

// Define metadata directly to avoid module resolution issues
export const metadata: Metadata = {
  title: 'Barracuda DMS App',
  description: 'Barracuda DMS Application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
