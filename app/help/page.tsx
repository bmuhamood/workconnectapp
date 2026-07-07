// app/help/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  HelpCircle, Search, MessageSquare, Phone, Mail, 
  FileText, Video, Users, Briefcase, CreditCard,
  Shield, Settings, Download, ArrowLeft, ChevronRight,
  CheckCircle
} from 'lucide-react';

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggleQuestion = (key: string) => setExpanded((prev) => (prev === key ? null : key));
  
  const categories = [
    {
      title: 'Getting Started',
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      qa: [
        { q: 'How do I create an account?', a: 'Click "Sign Up" and choose Worker or Employer. You\'ll need a valid email, phone number, and password to get started.' },
        { q: 'What information do I need to register?', a: 'Workers need their name, phone, city, profession, and (for verification) a National ID. Employers need their name, phone, and city — a company name if registering as a business.' },
        { q: 'How do I verify my account?', a: 'After registering, confirm your email via the link we send you. Workers additionally upload a National ID under Dashboard > Documents for admin review — verified badges appear once approved.' },
        { q: 'Can I change my account type?', a: 'Account roles (Worker/Employer/Admin) are fixed at registration for security reasons. If you need a different role, register a second account with a different email.' },
      ],
    },
    {
      title: 'For Workers',
      icon: Briefcase,
      color: 'from-green-500 to-emerald-500',
      qa: [
        { q: 'How do I find jobs?', a: 'Browse open postings on the Jobs page, filter by location or salary, and click Apply. You can also save jobs to revisit later from My Saved Jobs.' },
        { q: 'How do I update my profile?', a: 'Go to Dashboard > Profile to update your bio, skills, hourly rate, availability, and photo.' },
        { q: 'How does payment work?', a: 'Employers pay WorkConnect via mobile money or card; we then disburse your salary to your registered MTN/Airtel number or bank account each pay cycle.' },
        { q: 'What are verified skills?', a: 'Skills you add to your profile can be backed by certificates or reference checks. Verified skills appear with a badge and improve your ranking in employer searches.' },
      ],
    },
    {
      title: 'For Employers',
      icon: Users,
      color: 'from-purple-500 to-pink-500',
      qa: [
        { q: 'How do I post a job?', a: 'Go to Post a Job from your dashboard, fill in the role, salary range, and requirements, then publish. It\'ll appear in the public Jobs listing.' },
        { q: 'How do I review worker applications?', a: 'Open My Job Postings from your dashboard to see applicants per posting, with their profile, rating, and cover letter.' },
        { q: 'What are the hiring fees?', a: 'WorkConnect charges a service fee on top of the worker\'s salary, shown upfront when you create a contract — no hidden costs.' },
        { q: 'How do I manage contracts?', a: 'All your contracts live under Contracts in your dashboard, where you can sign, message the worker, upload documents, or start a trial period.' },
      ],
    },
    {
      title: 'Safety & Security',
      icon: Shield,
      color: 'from-amber-500 to-orange-500',
      qa: [
        { q: 'How do I report a user?', a: 'Use the Report a Concern form (linked in the footer) to flag harassment, fraud, or safety issues — our team reviews every submission.' },
        { q: 'What are safety guidelines?', a: 'See our full Safety Guidelines page for tips on meeting in person, payment safety, and what to do if something feels wrong.' },
        { q: 'How is my data protected?', a: 'Your data is protected with encryption in transit and at rest, and access is restricted by row-level security — see our Privacy Policy for details.' },
        { q: 'What should I do in unsafe situations?', a: 'Contact local emergency services immediately if you\'re in danger. Afterward, file a report so we can take action on the platform.' },
      ],
    },
    {
      title: 'Payments',
      icon: CreditCard,
      color: 'from-red-500 to-rose-500',
      qa: [
        { q: 'When will I get paid?', a: 'Workers are paid on the schedule set in their contract (typically monthly), shortly after the employer\'s invoice is paid.' },
        { q: 'What payment methods are accepted?', a: 'Employers can pay via MTN Mobile Money, Airtel Money, or card through our payment partner Flutterwave.' },
        { q: 'How do I set up payment?', a: 'Workers add a payout method (mobile money or bank) under Dashboard > Payments. Employers pay directly from an invoice — no setup needed.' },
        { q: 'What are the platform fees?', a: 'The service fee depends on the job category and is calculated automatically when a contract is created — shown clearly before you confirm.' },
      ],
    },
    {
      title: 'Account Settings',
      icon: Settings,
      color: 'from-indigo-500 to-violet-500',
      qa: [
        { q: 'How do I update my profile?', a: 'Workers: Dashboard > Profile. Employers: your company details are under Dashboard > Settings.' },
        { q: 'How do I change my password?', a: 'Go to Settings > Change Password. You\'ll need to enter a new password of at least 8 characters.' },
        { q: 'How do I delete my account?', a: 'Contact support via the Contact page to request account deletion — we\'ll confirm and remove your data per our retention policy.' },
        { q: 'How do I update notification settings?', a: 'Go to Settings > Notifications to control email, SMS, and push notifications for payments, contracts, and messages.' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/20 to-cyan-50/20">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-cyan-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to home
          </Link>

          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center space-x-3 mb-6">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                <HelpCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Help <span className="text-blue-600">Center</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Find answers to common questions or get in touch with our support team
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="search"
                placeholder="Search for help articles, guides, or FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-6 text-lg rounded-xl"
              />
              <Button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                Search
              </Button>
            </div>
          </div>

          {/* Quick Help Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Live Chat</h3>
                  <p className="text-sm text-gray-600">Get instant help</p>
                </div>
              </div>
              <a href={`https://wa.me/256769990812?text=${encodeURIComponent("Hi WorkConnect, I need help with...")}`} target="_blank" rel="noopener noreferrer">
                <Button className="w-full mt-4">Start Chat</Button>
              </a>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <Phone className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Call Us</h3>
                  <p className="text-sm text-gray-600">+256 769 990 812</p>
                </div>
              </div>
              <a href="tel:+256769990812"><Button className="w-full mt-4" variant="outline">Call Now</Button></a>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Email Support</h3>
                  <p className="text-sm text-gray-600">bbosa2009@gmail.com</p>
                </div>
              </div>
              <a href="mailto:bbosa2009@gmail.com"><Button className="w-full mt-4" variant="outline">Send Email</Button></a>
            </div>
          </div>

          {/* Categories */}
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Browse by Category</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {categories.map((category, catIndex) => {
              const filteredQa = category.qa.filter((item) =>
                !searchQuery || item.q.toLowerCase().includes(searchQuery.toLowerCase()) || item.a.toLowerCase().includes(searchQuery.toLowerCase())
              );
              if (searchQuery && filteredQa.length === 0) return null;
              return (
                <div key={catIndex} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                      <category.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{category.title}</h3>
                  </div>
                  <ul className="space-y-1">
                    {filteredQa.map((item, qIndex) => {
                      const key = `${catIndex}-${qIndex}`;
                      const isOpen = expanded === key;
                      return (
                        <li key={qIndex} className="border-b border-gray-50 last:border-0">
                          <button
                            onClick={() => toggleQuestion(key)}
                            className="w-full flex items-center justify-between py-2.5 text-left text-gray-700 hover:text-blue-600"
                          >
                            <span className="text-sm font-medium pr-2">{item.q}</span>
                            <ChevronRight className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                          </button>
                          {isOpen && (
                            <p className="text-sm text-gray-600 pb-3 pr-2">{item.a}</p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Resources */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-3xl p-8 mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Helpful Resources</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="font-bold text-gray-900">Guides & Tutorials</h3>
                    <p className="text-sm text-gray-600">Step-by-step instructions</p>
                  </div>
                </div>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Getting Started Guide
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Profile Optimization
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Payment Setup Guide
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Video className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="font-bold text-gray-900">Video Tutorials</h3>
                    <p className="text-sm text-gray-600">Watch and learn</p>
                  </div>
                </div>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Platform Walkthrough
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Safety Best Practices
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Mobile App Guide
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Download className="h-8 w-8 text-purple-600" />
                  <div>
                    <h3 className="font-bold text-gray-900">Downloads</h3>
                    <p className="text-sm text-gray-600">Useful documents</p>
                  </div>
                </div>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Safety Checklist
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Contract Templates
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Platform Rules PDF
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Still Need Help?</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Our support team is available 24/7 to help you with any questions or issues.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-10 py-6">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Contact Support
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-2 border-blue-200 text-blue-600 hover:bg-blue-50 px-10 py-6">
                <Phone className="h-5 w-5 mr-2" />
                Call: +256 769 990 812
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}