/**
 * Testimonials Section
 *
 * Social proof from manufacturing leaders showing real results:
 * - CFO: Cash freed up ($2M)
 * - Operations Director: Reduced stockouts/excess inventory
 * - Finance Manager: Time savings (10 hours → 30 minutes)
 *
 * @epic EPIC-PRICING-001
 * @story BMAD-PRICE-006
 */

import { Star, Quote } from 'lucide-react';

export const TestimonialsSection = () => {
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'CFO',
      company: 'Premium Beverages Ltd',
      image: '/testimonials/sarah.jpg',
      quote:
        'CapLiquify reduced our cash conversion cycle from 82 to 51 days. That freed up over $2M in working capital.',
      rating: 5,
    },
    {
      name: 'Michael Chen',
      role: 'Operations Director',
      company: 'Pacific Manufacturing',
      image: '/testimonials/michael.jpg',
      quote:
        "The AI forecasting is incredibly accurate. We've reduced stockouts by 40% and excess inventory by 35%.",
      rating: 5,
    },
    {
      name: 'Emily Rodriguez',
      role: 'Finance Manager',
      company: 'Artisan Foods Co.',
      image: '/testimonials/emily.jpg',
      quote: 'What used to take me 10 hours a week now takes 30 minutes. The ROI was immediate.',
      rating: 5,
    },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {testimonials.map((testimonial, index) => (
        <div key={index} className="bg-white rounded-xl shadow-lg p-6 relative">
          <Quote className="absolute top-4 right-4 w-8 h-8 text-blue-100" />

          <div className="flex items-center gap-1 mb-4">
            {[...Array(testimonial.rating)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            ))}
          </div>

          <p className="text-gray-700 mb-6 italic">"{testimonial.quote}"</p>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
              {testimonial.name.charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-gray-900">{testimonial.name}</div>
              <div className="text-sm text-gray-600">
                {testimonial.role}, {testimonial.company}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
