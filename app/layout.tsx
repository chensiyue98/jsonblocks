import './globals.css';
import React from 'react';
import Menubar from './components/Menubar';

export const metadata = {
  title: 'JSON → Graph Visualizer',
  description: 'Drag & drop JSON tree visualizer powered by React Flow',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Menubar />
        {children}
      </body>
    </html>
  );
}