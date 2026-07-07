'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Users, Heart, Ban, ArrowLeft, ScaleIcon } from 'lucide-react';

const sections = [
  {
    icon: Heart,
    color: 'from-emerald-500 to-teal-500',
    title: 'Respect & Dignity',
    points: [
      'Treat every worker, employer, and staff member with courtesy and respect, regardless of background, gender, religion, or tribe.',
      'No harassment, discrimination, or abusive language of any kind — in messages, reviews, or in person.',
      'Domestic work is real work. Fair pay, reasonable hours, and safe conditions are non-negotiable.',
    ],
  },
  {
    icon: Shield,
    color: 'from-blue-500 to-cyan-500',
    title: 'Honesty & Accuracy',
    points: [
      'Profiles, job postings, and applications must reflect real, accurate information.',
      'Don\u2019t misrepresent your identity, experience, qualifications, or the nature of a job.',
      'Verification documents must be genuine — submitting falsified IDs or certificates results in permanent suspension.',
    ],
  },
  {
    icon: Users,
    color: 'from-purple-500 to-pink-500',
    title: 'Fair Dealing',
    points: [
      'Honor the terms of contracts you agree to — pay and work schedules should match what was agreed.',
      'Use WorkConnect\u2019s messaging and payment tools rather than pushing transactions off-platform, which removes the protections both sides rely on.',
      'Give honest, fair reviews based on real experiences.',
    ],
  },
  {
    icon: Ban,
    color: 'from-red-500 to-orange-500',
    title: 'Zero Tolerance',
    points: [
      'Any form of physical, sexual, or verbal abuse results in immediate account termination and, where applicable, referral to authorities.',
      'Child labor, forced labor, or unsafe working conditions will be reported and result in a permanent platform ban.',
      'Fraud, scams, or attempts to circumvent platform fees through deception are not tolerated.',
    ],
  },
];

export default function CodeOfConductPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
        <Link href="/">
          <Button variant="ghost" className="mb-6 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
          </Button>
        </Link>

        <div className="text-center mb-12">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-blue-500 mb-4">
            <ScaleIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Code of Conduct</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            WorkConnect exists to make domestic work fairer and safer for everyone in Uganda. Here's what we expect from
            every member of this community.
          </p>
        </div>

        <div className="space-y-6">
          {sections.map((section) => (
            <Card key={section.title} className="border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-3 bg-gradient-to-r ${section.color} rounded-xl`}>
                    <section.icon className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
                </div>
                <ul className="space-y-2">
                  {section.points.map((p, i) => (
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

        <Card className="mt-8 border-blue-200 bg-blue-50">
          <CardContent className="p-6 text-center">
            <p className="text-blue-800 mb-4">
              Seen a violation of this code? Don't stay quiet — reporting helps keep everyone on the platform safe.
            </p>
            <Link href="/report">
              <Button className="bg-gradient-to-r from-blue-600 to-emerald-600">Report a Concern</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
