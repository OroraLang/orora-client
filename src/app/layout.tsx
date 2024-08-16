import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Orora UI',
  description: 'Orora Programming Language UI',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className='text-black w-screen h-screen flex-col'>{children}</body>
    </html>
  );
}
