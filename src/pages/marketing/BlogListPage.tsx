/**
 * CapLiquify Blog List Page
 *
 * Blog homepage showing all posts with category filtering and newsletter signup.
 *
 * @module src/pages/marketing/BlogListPage
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Calendar, Clock, User, ArrowRight } from 'lucide-react'

interface BlogPost {
  slug: string
  title: string
  excerpt: string
  author: string
  date: string
  category: string
  readTime: string
  image: string
}

const BlogListPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [email, setEmail] = useState('')

  const categories = [
    { id: 'all', name: 'All Posts' },
    { id: 'cash-flow', name: 'Cash Flow' },
    { id: 'inventory', name: 'Inventory' },
    { id: 'forecasting', name: 'Forecasting' },
    { id: 'case-studies', name: 'Case Studies' },
    { id: 'industry-insights', name: 'Industry Insights' }
  ]

  const posts: BlogPost[] = [
    {
      slug: 'reduce-cash-conversion-cycle',
      title: '7 Proven Strategies to Reduce Your Cash Conversion Cycle',
      excerpt: 'Learn how leading manufacturers are achieving <55 day CCC and freeing up millions in working capital.',
      author: 'Sarah Johnson',
      date: '2025-10-15',
      category: 'cash-flow',
      readTime: '8 min read',
      image: '/blog/ccc-strategies.jpg'
    },
    {
      slug: 'ai-forecasting-guide',
      title: 'The Complete Guide to AI-Powered Cash Flow Forecasting',
      excerpt: 'Understand how ensemble AI models can improve your forecast accuracy by 40%+.',
      author: 'Michael Chen',
      date: '2025-10-10',
      category: 'forecasting',
      readTime: '12 min read',
      image: '/blog/ai-forecasting.jpg'
    },
    {
      slug: 'working-capital-benchmarks',
      title: '2025 Working Capital Benchmarks for Manufacturers',
      excerpt: 'Industry benchmarks for DSO, DIO, DPO, and CCC across manufacturing sectors.',
      author: 'David Williams',
      date: '2025-10-05',
      category: 'cash-flow',
      readTime: '6 min read',
      image: '/blog/benchmarks.jpg'
    },
    {
      slug: 'inventory-optimization-guide',
      title: 'The Ultimate Guide to Inventory Optimization for Manufacturers',
      excerpt: 'Step-by-step strategies to reduce carrying costs while maintaining service levels.',
      author: 'Sarah Johnson',
      date: '2025-10-01',
      category: 'inventory',
      readTime: '10 min read',
      image: '/blog/inventory-optimization.jpg'
    },
    {
      slug: 'sentia-spirits-case-study',
      title: 'Case Study: How Sentia Spirits Reduced CCC from 78 to 52 Days',
      excerpt: 'A deep dive into the strategies and technology behind a 33% CCC reduction in 4 months.',
      author: 'Michael Chen',
      date: '2025-09-28',
      category: 'case-studies',
      readTime: '7 min read',
      image: '/blog/sentia-case-study.jpg'
    }
  ]

  const filteredPosts =
    selectedCategory === 'all' ? posts : posts.filter((post) => post.category === selectedCategory)

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement newsletter signup
    console.log('Newsletter signup:', email)
    setEmail('')
    alert('Thanks for subscribing! Check your email for confirmation.')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl lg:text-6xl font-bold mb-4">CapLiquify Blog</h1>
            <p className="text-xl opacity-90">
              Insights on working capital management, cash flow forecasting, and manufacturing finance
            </p>
          </motion.div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="border-b border-gray-200 bg-white sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post, index) => (
              <motion.article
                key={post.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow group"
              >
                <Link to={`/blog/${post.slug}`} className="block">
                  {/* Image */}
                  <div className="relative h-48 bg-gradient-to-br from-blue-600 to-purple-600 overflow-hidden">
                    <div className="absolute inset-0 bg-gray-900 opacity-20"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">Feature Image</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Category & Read Time */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {categories.find((c) => c.id === post.category)?.name || post.category}
                      </span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{post.readTime}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </h2>

                    {/* Excerpt */}
                    <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>

                    {/* Author & Date */}
                    <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-100 pt-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{post.author}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(post.date).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Read More */}
                    <div className="mt-4 flex items-center gap-2 text-blue-600 font-semibold group-hover:gap-3 transition-all">
                      <span>Read More</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-xl text-gray-600">No posts found in this category.</p>
          </div>
        )}
      </div>

      {/* Newsletter Signup */}
      <div className="bg-blue-50 py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Get Weekly Insights</h2>
          <p className="text-gray-600 mb-8">
            Join 1,000+ manufacturing finance professionals receiving our weekly newsletter
          </p>
          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              Subscribe
            </button>
          </form>
          <p className="text-sm text-gray-500 mt-4">No spam. Unsubscribe anytime.</p>
        </div>
      </div>
    </div>
  )
}

export default BlogListPage
