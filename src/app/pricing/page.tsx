// src/app/pricing/page.tsx - Pricing page with tiers and checkout

import { Check, X } from 'lucide-react';
import { CheckoutButton } from '@/components/billing/CheckoutButton';
import { PRICING_TIERS, formatPrice } from '@/lib/billing/pricing-config';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Choose the perfect plan for your development needs
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {Object.values(PRICING_TIERS).map((tier) => (
            <div
              key={tier.id}
              className={`relative rounded-2xl p-8 ${
                tier.highlighted
                  ? 'bg-gradient-to-b from-blue-600 to-purple-600 text-white shadow-2xl scale-105'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg'
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-sm font-bold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="mb-8">
                <h3 className={`text-2xl font-bold mb-2 ${
                  tier.highlighted ? 'text-white' : 'text-gray-900 dark:text-white'
                }`}>
                  {tier.name}
                </h3>
                <p className={`text-sm mb-4 ${
                  tier.highlighted ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {tier.description}
                </p>
                <div className="flex items-baseline">
                  <span className={`text-4xl font-bold ${
                    tier.highlighted ? 'text-white' : 'text-gray-900 dark:text-white'
                  }`}>
                    {formatPrice(tier.monthlyPrice)}
                  </span>
                  <span className={`ml-2 ${
                    tier.highlighted ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    /month
                  </span>
                </div>
                {tier.yearlyPrice > 0 && (
                  <p className={`text-sm mt-2 ${
                    tier.highlighted ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    Or {formatPrice(tier.yearlyPrice / 12)}/mo billed yearly
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className={`w-5 h-5 mr-2 flex-shrink-0 ${
                      tier.highlighted ? 'text-blue-200' : 'text-green-500'
                    }`} />
                    <span className={`text-sm ${
                      tier.highlighted ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {feature.replace('✅ ', '')}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              {tier.monthlyPrice === 0 ? (
                <a
                  href="/signup"
                  className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition-colors ${
                    tier.highlighted
                      ? 'bg-white text-blue-600 hover:bg-gray-100'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {tier.cta}
                </a>
              ) : tier.id === 'enterprise' ? (
                <a
                  href="/contact-sales"
                  className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition-colors ${
                    tier.highlighted
                      ? 'bg-white text-blue-600 hover:bg-gray-100'
                      : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
                  }`}
                >
                  {tier.cta}
                </a>
              ) : (
                <CheckoutButton
                  tierId={tier.id as 'developer' | 'team'}
                  billing="monthly"
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                    tier.highlighted
                      ? 'bg-white text-blue-600 hover:bg-gray-100'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {tier.cta}
                </CheckoutButton>
              )}
            </div>
          ))}
        </div>

        {/* Feature Comparison */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold mb-8 text-center">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-4 px-4">Feature</th>
                  {Object.values(PRICING_TIERS).map((tier) => (
                    <th key={tier.id} className="text-center py-4 px-4">
                      {tier.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b dark:border-gray-700">
                  <td className="py-4 px-4 font-medium">AI Requests</td>
                  {Object.values(PRICING_TIERS).map((tier) => (
                    <td key={tier.id} className="text-center py-4 px-4">
                      {tier.limits.aiRequests === -1 ? 'Unlimited' : tier.limits.aiRequests.toLocaleString()}
                    </td>
                  ))}
                </tr>
                <tr className="border-b dark:border-gray-700">
                  <td className="py-4 px-4 font-medium">Storage</td>
                  {Object.values(PRICING_TIERS).map((tier) => (
                    <td key={tier.id} className="text-center py-4 px-4">
                      {tier.limits.fileStorage === -1 ? 'Unlimited' : `${tier.limits.fileStorage} GB`}
                    </td>
                  ))}
                </tr>
                <tr className="border-b dark:border-gray-700">
                  <td className="py-4 px-4 font-medium">Build Minutes</td>
                  {Object.values(PRICING_TIERS).map((tier) => (
                    <td key={tier.id} className="text-center py-4 px-4">
                      {tier.limits.buildMinutes === -1 ? 'Unlimited' : tier.limits.buildMinutes.toLocaleString()}
                    </td>
                  ))}
                </tr>
                <tr className="border-b dark:border-gray-700">
                  <td className="py-4 px-4 font-medium">Collaborators</td>
                  {Object.values(PRICING_TIERS).map((tier) => (
                    <td key={tier.id} className="text-center py-4 px-4">
                      {tier.limits.collaborators === -1 ? 'Unlimited' : tier.limits.collaborators === 0 ? '-' : tier.limits.collaborators}
                    </td>
                  ))}
                </tr>
                <tr className="border-b dark:border-gray-700">
                  <td className="py-4 px-4 font-medium">Private Repos</td>
                  {Object.values(PRICING_TIERS).map((tier) => (
                    <td key={tier.id} className="text-center py-4 px-4">
                      {tier.limits.privateRepos === -1 ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : tier.limits.privateRepos === 0 ? (
                        <X className="w-5 h-5 text-gray-400 mx-auto" />
                      ) : (
                        tier.limits.privateRepos
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b dark:border-gray-700">
                  <td className="py-4 px-4 font-medium">Custom Domains</td>
                  {Object.values(PRICING_TIERS).map((tier) => (
                    <td key={tier.id} className="text-center py-4 px-4">
                      {tier.limits.customDomains === -1 ? 'Unlimited' : tier.limits.customDomains === 0 ? '-' : tier.limits.customDomains}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="font-semibold mb-2">Can I change plans anytime?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately and we'll prorate any charges.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="font-semibold mb-2">Do you offer a free trial?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes, Developer and Team plans include a 14-day free trial. Enterprise plans offer a 30-day trial.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                We accept all major credit cards through Stripe. Enterprise customers can also pay via invoice.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="font-semibold mb-2">Can I cancel my subscription?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                You can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}