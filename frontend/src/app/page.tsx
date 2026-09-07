'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowRight,
  BarChart3,
  Brain,
  Shield,
  Zap,
  FileText,
  TrendingUp,
  Search,
  Lightbulb,
  MessageSquare,
  History as HistoryIcon,
  Upload,
  CheckCircle,
} from 'lucide-react';

const features = [
  {
    icon: Upload,
    title: 'Smart File Upload',
    description: 'Upload PDF or Excel financial statements. Our AI extracts, validates, and structures your data automatically.',
    color: 'text-blue-600 bg-blue-100',
  },
  {
    icon: Brain,
    title: 'AI-Powered Analysis',
    description: 'Advanced algorithms detect patterns, trends, anomalies, and risks. Get priority-scored insights with root cause analysis.',
    color: 'text-purple-600 bg-purple-100',
  },
  {
    icon: BarChart3,
    title: 'Interactive Visualizations',
    description: 'Three specialized charts: Growth Engine (Revenue vs Net Income), Profitability Safety Gap, and Cash Runway Horizon.',
    color: 'text-green-600 bg-green-100',
  },
  {
    icon: Lightbulb,
    title: 'Actionable Recommendations',
    description: 'Get specific suggestions with reasoning, transparency on decision-making, and "what happens if you do nothing" scenarios.',
    color: 'text-orange-600 bg-orange-100',
  },
  {
    icon: MessageSquare,
    title: 'AI Financial Copilot',
    description: 'Chat with your data. Ask questions, get calculations, and receive explanations. Powered by Gemini with persistent memory.',
    color: 'text-pink-600 bg-pink-100',
  },
  {
    icon: Shield,
    title: 'Privacy & Security',
    description: 'PII detection and privacy scanning on upload. Your data stays secure with Firebase auth and Supabase storage.',
    color: 'text-red-600 bg-red-100',
  },
];

const stats = [
  { value: '3', label: 'Specialized Charts', icon: BarChart3 },
  { value: '100', label: 'Quality Score Max', icon: CheckCircle },
  { value: '4', label: 'Risk Categories', icon: Shield },
  { value: '∞', label: 'Chat History', icon: MessageSquare },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 via-white to-white py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <Badge variant="info" size="lg" className="mb-6" dot>
                New: AI Financial Intelligence Platform
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight mb-6"
            >
              Transform Financial Data into{' '}
              <span className="text-primary-600">Actionable Intelligence</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto"
            >
              Upload PDF or Excel financial statements. Get AI-powered pattern detection, risk analysis, 
              interactive charts, and an intelligent copilot that remembers your data.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/upload">
                <Button size="xl" className="w-full sm:w-auto gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Your First File
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="xl" className="w-full sm:w-auto">
                  Sign In to Dashboard
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Floating animation elements */}
          <motion.div
            className="absolute top-20 right-10 w-72 h-72 bg-primary-100/50 rounded-full blur-3xl"
            animate={{ scale: [1, 1.1, 1], x: [0, 20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-20 left-10 w-96 h-96 bg-purple-100/50 rounded-full blur-3xl"
            animate={{ scale: [1, 1.05, 1], y: [0, -15, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className={cn('w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center', `${stat.color || 'text-primary-600 bg-primary-100'}`)}>
                  <stat.icon className="w-7 h-7" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-gray-600 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-28 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Financial Intelligence
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From upload to insight to action — a complete workflow powered by AI
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4', feature.color)}>
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A seamless flow from raw data to intelligent decisions
            </p>
          </motion.div>

          <div className="relative">
            <div className="hidden lg:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-0.5 bg-gradient-to-r from-primary-200 via-primary-400 to-purple-400" />
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 relative z-10">
              {[
                { step: '01', title: 'Upload', desc: 'Drag & drop PDF or Excel files', icon: FileText },
                { step: '02', title: 'Scan', desc: 'Privacy & PII detection', icon: Search },
                { step: '03', title: 'Validate', desc: 'Quality scoring & issues', icon: CheckCircle },
                { step: '04', title: 'Analyze', desc: 'AI patterns, trends, risks', icon: Brain },
                { step: '05', title: 'Decide', desc: 'Insights, charts & copilot', icon: TrendingUp },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="relative text-center"
                >
                  <div className="relative z-10">
                    <div className={cn('w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center', index % 2 === 0 ? 'bg-primary-600' : 'bg-purple-600')}>
                      <item.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">{item.step}</div>
                    <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                  <div className="absolute top-8 left-1/2 w-2 h-2 bg-primary-600 rounded-full -translate-x-1/2" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Charts Preview */}
      <section className="py-20 lg:py-28 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Specialized Financial Charts
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Three purpose-built visualizations designed for financial decision-making
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Chart A: Growth Engine',
                subtitle: 'Revenue vs Net Income',
                description: 'Spot inefficient growth — when revenue rises but profits fall. Flags "Inefficient Growth Alarm" automatically.',
                color: 'text-blue-600',
                bg: 'bg-blue-50',
                border: 'border-blue-200',
              },
              {
                title: 'Chart B: Profitability Safety Gap',
                subtitle: 'Gross Margin vs Net Margin %',
                description: 'Reveal hidden cost creep. Flat gross margin but shrinking net margin = internal spending problem.',
                color: 'text-green-600',
                bg: 'bg-green-50',
                border: 'border-green-200',
              },
              {
                title: 'Chart C: Cash Runway Horizon',
                subtitle: 'Months of Survival',
                description: 'Startup-focused. Projects cash runway based on balance trends. Critical for fundraising timing.',
                color: 'text-orange-600',
                bg: 'bg-orange-50',
                border: 'border-orange-200',
              },
            ].map((chart, index) => (
              <motion.div
                key={chart.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className={cn('h-full border-2', chart.border)}>
                  <CardContent className="p-6">
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4', chart.bg)}>
                      <span className={cn('text-2xl font-bold', chart.color)}>{index + 1}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{chart.title}</h3>
                    <p className="text-sm text-gray-500 mb-4">{chart.subtitle}</p>
                    <p className="text-gray-600 text-sm">{chart.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-primary-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Understand Your Financials?
            </h2>
            <p className="text-primary-100 text-lg mb-8 max-w-2xl mx-auto">
              Upload your first financial statement and get AI-powered insights in minutes. 
              No credit card required to start.
            </p>
            <Link href="/signup">
              <Button size="xl" variant="secondary" className="gap-2">
                Start Free Analysis
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}