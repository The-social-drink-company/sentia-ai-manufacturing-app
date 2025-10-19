/**
 * CapLiquify Blog Post Page
 *
 * Individual blog post page with table of contents, author bio, and related posts.
 *
 * @module src/pages/marketing/BlogPostPage
 */

import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, User, Calendar, Share2, Twitter, Linkedin, Mail, ArrowLeft } from 'lucide-react'

const BlogPostPage = () => {
  const { slug } = useParams()

  // In production, fetch post data based on slug
  // For now, using sample data
  const post = {
    title: '7 Proven Strategies to Reduce Your Cash Conversion Cycle',
    slug: 'reduce-cash-conversion-cycle',
    author: 'Sarah Johnson',
    authorBio: 'CFO and working capital expert with 15+ years in manufacturing finance',
    authorImage: '/authors/sarah-johnson.jpg',
    date: '2025-10-15',
    readTime: '8 min read',
    category: 'cash-flow',
    image: '/blog/ccc-strategies.jpg',
    excerpt:
      'Learn how leading manufacturers are achieving <55 day CCC and freeing up millions in working capital.'
  }

  const tableOfContents = [
    { id: 'intro', title: 'What is Cash Conversion Cycle?' },
    { id: 'benchmarks', title: 'Industry Benchmarks' },
    { id: 'strategy-1', title: 'Strategy 1: Optimize Inventory Levels' },
    { id: 'strategy-2', title: 'Strategy 2: Accelerate Collections' },
    { id: 'strategy-3', title: 'Strategy 3: Negotiate Payment Terms' },
    { id: 'strategy-4', title: 'Strategy 4: Implement Just-in-Time' },
    { id: 'strategy-5', title: 'Strategy 5: Use Technology' },
    { id: 'strategy-6', title: 'Strategy 6: Forecast Accurately' },
    { id: 'strategy-7', title: 'Strategy 7: Monitor KPIs' },
    { id: 'conclusion', title: 'Conclusion' }
  ]

  const relatedPosts = [
    {
      slug: 'ai-forecasting-guide',
      title: 'The Complete Guide to AI-Powered Cash Flow Forecasting',
      excerpt: 'Understand how ensemble AI models can improve your forecast accuracy by 40%+.',
      readTime: '12 min read'
    },
    {
      slug: 'working-capital-benchmarks',
      title: '2025 Working Capital Benchmarks for Manufacturers',
      excerpt: 'Industry benchmarks for DSO, DIO, DPO, and CCC across manufacturing sectors.',
      readTime: '6 min read'
    },
    {
      slug: 'inventory-optimization-guide',
      title: 'The Ultimate Guide to Inventory Optimization for Manufacturers',
      excerpt: 'Step-by-step strategies to reduce carrying costs while maintaining service levels.',
      readTime: '10 min read'
    }
  ]

  const handleShare = (platform: string) => {
    const url = window.location.href
    const text = post.title

    switch (platform) {
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
          '_blank'
        )
        break
      case 'linkedin':
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
          '_blank'
        )
        break
      case 'email':
        window.location.href = `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`
        break
      case 'copy':
        navigator.clipboard.writeText(url)
        alert('Link copied to clipboard!')
        break
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Image */}
      <div className="relative h-96 bg-gray-900">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 opacity-80"></div>

        {/* Content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold inline-block mb-4"
            >
              {post.category.replace('-', ' ').toUpperCase()}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl font-bold text-white mb-4"
            >
              {post.title}
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center gap-6 text-white/90"
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{post.author}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(post.date).toLocaleDateString()}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{post.readTime}</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Back Button */}
        <Link
          to="/blog"
          className="absolute top-24 left-8 flex items-center gap-2 text-white hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Blog</span>
        </Link>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Table of Contents (Sidebar) */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4">Table of Contents</h3>
              <nav className="space-y-2">
                {tableOfContents.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    {item.title}
                  </a>
                ))}
              </nav>

              <div className="mt-8 pt-8 border-t border-gray-200">
                <p className="text-sm font-semibold text-gray-900 mb-4">Share this post</p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleShare('twitter')}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <Twitter className="w-4 h-4" />
                    Share on Twitter
                  </button>
                  <button
                    onClick={() => handleShare('linkedin')}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                    Share on LinkedIn
                  </button>
                  <button
                    onClick={() => handleShare('email')}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    Share via Email
                  </button>
                  <button
                    onClick={() => handleShare('copy')}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    Copy Link
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <article className="lg:col-span-3 prose prose-lg max-w-none">
            <section id="intro">
              <h2>What is Cash Conversion Cycle?</h2>
              <p>
                The cash conversion cycle (CCC) is one of the most important metrics for manufacturing companies. It
                measures how long it takes to convert inventory and receivables into cash.
              </p>
              <p className="font-semibold text-blue-600">
                CCC = Days Sales Outstanding (DSO) + Days Inventory Outstanding (DIO) - Days Payables Outstanding (DPO)
              </p>
              <p>
                A lower CCC means you're converting inventory to cash faster, which improves liquidity and reduces the
                need for external financing.
              </p>
            </section>

            <section id="benchmarks">
              <h2>Industry Benchmarks</h2>
              <p>According to our 2025 analysis of 500+ manufacturers:</p>
              <ul>
                <li>
                  <strong>Best-in-class</strong>: &lt;55 days
                </li>
                <li>
                  <strong>Average</strong>: 78 days
                </li>
                <li>
                  <strong>Below average</strong>: &gt;90 days
                </li>
              </ul>
              <p>
                If your CCC is above 78 days, there's significant opportunity to free up working capital and improve
                cash flow.
              </p>
            </section>

            <section id="strategy-1">
              <h2>Strategy 1: Optimize Inventory Levels</h2>
              <p>
                Excess inventory is the #1 drain on working capital for manufacturers. Every dollar tied up in inventory
                is a dollar that can't be used for growth, debt reduction, or opportunistic investments.
              </p>
              <p>
                <strong>How to optimize:</strong>
              </p>
              <ul>
                <li>Calculate optimal reorder points based on lead times and demand variability</li>
                <li>Implement ABC analysis to focus on high-value items</li>
                <li>Use demand forecasting to reduce safety stock requirements</li>
                <li>Consider just-in-time (JIT) inventory for fast-moving items</li>
              </ul>
              <p>
                <strong>Expected impact:</strong> Reducing inventory by 20% can free up significant cash and reduce DIO
                by 15-20 days.
              </p>
            </section>

            <section id="strategy-2">
              <h2>Strategy 2: Accelerate Collections</h2>
              <p>
                Days Sales Outstanding (DSO) measures how quickly you collect cash from customers. The faster you
                collect, the better your cash position.
              </p>
              <p>
                <strong>How to accelerate collections:</strong>
              </p>
              <ul>
                <li>Offer early payment discounts (e.g., 2/10 net 30)</li>
                <li>Send invoices immediately upon delivery</li>
                <li>Implement automated payment reminders</li>
                <li>Accept multiple payment methods (ACH, credit card, wire)</li>
                <li>Monitor aging reports weekly and follow up proactively</li>
              </ul>
              <p>
                <strong>Expected impact:</strong> Reducing DSO from 45 days to 35 days frees up 10 days of revenue in
                cash.
              </p>
            </section>

            <section id="strategy-3">
              <h2>Strategy 3: Negotiate Payment Terms with Suppliers</h2>
              <p>
                Days Payables Outstanding (DPO) measures how long you take to pay suppliers. Extending DPO (without
                damaging relationships) improves cash flow.
              </p>
              <p>
                <strong>How to extend payment terms:</strong>
              </p>
              <ul>
                <li>Negotiate longer payment terms (e.g., net 45 or net 60)</li>
                <li>Consolidate suppliers to increase bargaining power</li>
                <li>Offer to pay electronically in exchange for longer terms</li>
                <li>Build strong supplier relationships to earn flexibility</li>
              </ul>
              <p>
                <strong>Expected impact:</strong> Extending DPO from 30 days to 45 days improves CCC by 15 days.
              </p>
            </section>

            <section id="strategy-4">
              <h2>Strategy 4: Implement Just-in-Time (JIT) Inventory</h2>
              <p>
                Just-in-time inventory reduces holding costs and minimizes cash tied up in inventory. By receiving
                inventory only when needed, you can significantly reduce DIO.
              </p>
              <p>
                <strong>JIT best practices:</strong>
              </p>
              <ul>
                <li>Partner with reliable suppliers for frequent deliveries</li>
                <li>Implement pull-based production systems</li>
                <li>Use kanban or other visual management tools</li>
                <li>Maintain safety stock only for critical items</li>
              </ul>
              <p>
                <strong>Expected impact:</strong> JIT can reduce inventory levels by 30-50%, dramatically improving CCC.
              </p>
            </section>

            <section id="strategy-5">
              <h2>Strategy 5: Use Technology to Automate and Optimize</h2>
              <p>
                Modern working capital management software can identify opportunities and automate processes that would
                take weeks manually.
              </p>
              <p>
                <strong>Key technology capabilities:</strong>
              </p>
              <ul>
                <li>AI-powered cash flow forecasting (85%+ accuracy)</li>
                <li>Automated reorder point calculations</li>
                <li>Real-time working capital dashboards</li>
                <li>Proactive alerts for late payments or low cash balances</li>
                <li>What-if scenario modeling</li>
              </ul>
              <p>
                <strong>Expected impact:</strong> Manufacturers using CapLiquify reduce CCC by an average of 23% within
                6 months.
              </p>
            </section>

            <section id="strategy-6">
              <h2>Strategy 6: Forecast Accurately</h2>
              <p>
                Accurate forecasting reduces the need for excess inventory and helps you plan cash needs proactively.
              </p>
              <p>
                <strong>Forecasting best practices:</strong>
              </p>
              <ul>
                <li>Use ensemble AI models that combine multiple algorithms</li>
                <li>Incorporate seasonality and market trends</li>
                <li>Update forecasts monthly based on actuals</li>
                <li>Include confidence intervals to understand risk</li>
              </ul>
              <p>
                <strong>Expected impact:</strong> Improving forecast accuracy from 65% to 85% can reduce safety stock
                requirements by 30%.
              </p>
            </section>

            <section id="strategy-7">
              <h2>Strategy 7: Monitor KPIs Weekly</h2>
              <p>
                What gets measured gets managed. Track your working capital KPIs weekly to identify trends and take
                corrective action quickly.
              </p>
              <p>
                <strong>Key KPIs to monitor:</strong>
              </p>
              <ul>
                <li>Cash Conversion Cycle (CCC)</li>
                <li>Days Sales Outstanding (DSO)</li>
                <li>Days Inventory Outstanding (DIO)</li>
                <li>Days Payables Outstanding (DPO)</li>
                <li>Current ratio and quick ratio</li>
                <li>Cash balance and runway</li>
              </ul>
              <p>
                <strong>Expected impact:</strong> Weekly monitoring enables faster course corrections and prevents small
                issues from becoming crises.
              </p>
            </section>

            <section id="conclusion">
              <h2>Conclusion</h2>
              <p>
                By implementing these 7 strategies, you can reduce your CCC by 20-30% within 6 months, freeing up
                millions in working capital that can be reinvested in growth.
              </p>
              <p>
                The key is to start small, measure results, and scale what works. Most manufacturers see the biggest
                impact from optimizing inventory (#1) and accelerating collections (#2).
              </p>
              <p>
                <strong>Ready to take action?</strong> CapLiquify's AI-powered platform makes it easy to implement all 7
                strategies. Our customers reduce CCC by an average of 26 days within their first 6 months.
              </p>
            </section>
          </article>
        </div>

        {/* Author Bio */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-12 h-12 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">About {post.author}</h3>
              <p className="text-gray-600 mb-4">{post.authorBio}</p>
              <div className="flex gap-4">
                <a href="#" className="text-blue-600 hover:underline">
                  LinkedIn
                </a>
                <a href="#" className="text-blue-600 hover:underline">
                  Twitter
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Related Posts */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Related Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {relatedPosts.map((relatedPost) => (
              <Link
                key={relatedPost.slug}
                to={`/blog/${relatedPost.slug}`}
                className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {relatedPost.title}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{relatedPost.excerpt}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{relatedPost.readTime}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Optimize Your Working Capital?</h2>
          <p className="text-xl mb-8 opacity-90">Start your 14-day free trial of CapLiquify today</p>
          <Link
            to="/sign-up"
            className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
          >
            Start Free Trial
          </Link>
        </div>
      </div>
    </div>
  )
}

export default BlogPostPage
