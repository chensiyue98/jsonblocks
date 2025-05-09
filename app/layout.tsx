import './globals.css';
import React from 'react';

export const metadata = {
  title: 'JSON → Graph Visualizer',
  description: 'Drag & drop JSON tree visualizer powered by React Flow',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}