'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Accessibility, Eye, Keyboard, MonitorSmartphone, MessageCircle, ArrowLeft } from 'lucide-react';

const commitments = [
  {
    icon: Eye,
    title: 'Visual Accessibility',
    points: ['High-contrast text and color combinations throughout the platform', "Text resizing support via your browser's standard zoom controls", 'Descriptive alt text on meaningful images and icons'],
  },
  {
    icon: Keyboard,
    title: 'Keyboard Navigation',
    points: ['All interactive elements (menus, forms, buttons) reachable via keyboard', 'Visible focus indicators when tabbing through the page', 'Logical tab order matching the visual layout'],
  },
  {
    icon: MonitorSmartphone,
    title: 'Responsive Design',
    points: ['Fully usable on phones, tablets, and desktops', 'No horizontal scrolling required on standard screen sizes', 'Touch targets sized for comfortable tapping on mobile'],
  },
  {
    icon: MessageCircle,
    title: 'Clear Communication',
    points: ['Plain language across forms, errors, and instructions', 'Form fields paired with visible labels, not placeholder-only text', 'Error messages that explain what went wrong and how to fix it'],
  },
];

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-3xl">
        <Link href="/">
          <Button variant="ghost" className="mb-6 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
          </Button>
        </Link>

        <div className="text-center mb-12">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-blue-500 mb-4">
            <Accessibility className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Accessibility Statement</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            WorkConnect connects people across Uganda to real work — that only means something if the platform itself
            is usable by everyone. Here's where we stand today, and how to reach us if something isn't working for you.
          </p>
        </div>

        <div className="space-y-6 mb-10">
          {commitments.map((c) => (
            <Card key={c.title} className="border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl">
                    <c.icon className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">{c.title}</h2>
                </div>
                <ul className="space-y-2">
                  {c.points.map((p, i) => (
                    <li key={i} className="flex gap-2 text-gray-700">
                      <span className="text-emerald-600 mt-1">•</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6 text-center">
            <p className="text-blue-800 mb-4">
              Run into an accessibility barrier using WorkConnect? Tell us — we want to fix it.
            </p>
            <a href="mailto:bbosa2009@gmail.com">
              <Button className="bg-gradient-to-r from-blue-600 to-emerald-600">Email Us</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
