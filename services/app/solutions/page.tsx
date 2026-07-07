'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, Building2, Users, ShieldCheck, Clock, ArrowLeft, ArrowRight } from 'lucide-react';

const solutions = [
  {
    icon: Home,
    color: 'from-emerald-500 to-teal-500',
    title: 'For Households',
    description: 'Find verified nannies, housekeepers, cooks, gardeners, drivers, and security guards for your home.',
    points: ['Browse verified, rated workers', 'Structured trial periods before committing', 'Contracts and payments handled on-platform'],
    cta: { label: 'Find a Worker', href: '/workers' },
  },
  {
    icon: Building2,
    color: 'from-blue-500 to-cyan-500',
    title: 'For Businesses',
    description: 'TechHub and other companies use WorkConnect to hire drivers, security, and support staff at scale.',
    points: ['Post multiple openings', 'Manage all your hires from one dashboard', 'Consolidated monthly invoicing'],
    cta: { label: 'Post a Job', href: '/post-job' },
  },
  {
    icon: Users,
    color: 'from-purple-500 to-pink-500',
    title: 'For Workers',
    description: 'Build a verified profile, get discovered by employers across Kampala, and get paid reliably via mobile money.',
    points: ['Free to join and apply', 'Ratings that build your reputation over time', 'Mobile money payouts (MTN, Airtel)'],
    cta: { label: 'Join as a Worker', href: '/register/worker' },
  },
];

const trustPoints = [
  { icon: ShieldCheck, title: 'Identity Verification', desc: 'National ID checks and document verification before workers appear as "verified."' },
  { icon: Clock, title: 'Trial Periods', desc: "Every contract can start with a trial period so both sides can confirm it's a good fit." },
  { icon: Users, title: 'Real Reviews', desc: 'Ratings only count when tied to a completed contract — no anonymous drive-by reviews.' },
];

export default function SolutionsPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-5xl">
        <Link href="/">
          <Button variant="ghost" className="mb-6 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
          </Button>
        </Link>

        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Solutions for Every Household and Business</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Whatever kind of help you need — or however you want to work — WorkConnect has a path built for you.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {solutions.map((s) => (
            <Card key={s.title} className="border border-gray-200 shadow-sm flex flex-col">
              <CardContent className="p-6 flex flex-col flex-1">
                <div className={`inline-flex p-3 bg-gradient-to-r ${s.color} rounded-xl w-fit mb-4`}>
                  <s.icon className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{s.title}</h2>
                <p className="text-gray-600 mb-4">{s.description}</p>
                <ul className="space-y-1.5 mb-6 flex-1">
                  {s.points.map((p) => (
                    <li key={p} className="text-sm text-gray-600 flex gap-2"><span className="text-emerald-600">•</span>{p}</li>
                  ))}
                </ul>
                <Link href={s.cta.href}>
                  <Button variant="outline" className="w-full">
                    {s.cta.label} <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Built on trust</h2>
          <p className="text-gray-600">The features underneath every solution above.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {trustPoints.map((t) => (
            <div key={t.title} className="text-center">
              <div className="inline-flex p-3 bg-white border border-gray-200 rounded-xl mb-3">
                <t.icon className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{t.title}</h3>
              <p className="text-sm text-gray-600">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
