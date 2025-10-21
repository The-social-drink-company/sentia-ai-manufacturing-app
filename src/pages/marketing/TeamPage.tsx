/**
 * CapLiquify Team Page
 *
 * Showcases the expert team behind the platform
 *
 * @module src/pages/marketing/TeamPage
 */

import { motion } from 'framer-motion'
import { Mail, Phone, Linkedin, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

// Team data extracted from financeflo.ai
const TEAM_MEMBERS = [
  {
    name: 'Dudley Peacock',
    title: 'Founder & CEO',
    bio: 'ERP Systems Specialist and Fractional AI Officer with 20+ years of experience. Led 230+ ERP implementations for mid-sized and multinational companies, achieving consistent 20%-30% annual growth. Expert in the Adaptive Intelligence Framework™ combining AI and ERP for transformational business results.',
    email: 'dudley@capliquify.com',
    phone: '+44 730 660 4807',
    image: '/team/dudley-peacock.jpg', // Placeholder
  },
  {
    name: 'Sandra Peacock',
    title: 'Managing Director',
    bio: 'Turning business challenges into success stories, Sandra leads our mission to make ERP actually work for businesses. With extensive experience in business transformation and strategic leadership, she ensures every implementation delivers measurable results and drives organizational growth.',
    image: '/team/sandra-peacock.jpg', // Placeholder
  },
  {
    name: 'Matthew Comins',
    title: 'CFO',
    bio: 'Bringing strategic financial leadership and deep expertise in finance transformation, Matthew ensures that our AI-powered ERP solutions deliver measurable financial results. As CFO, he combines extensive experience in financial management with cutting-edge technology to help businesses achieve sustainable growth.',
    image: '/team/matthew-comins.jpg', // Placeholder
  },
  {
    name: 'Adam Pavitt',
    title: 'Director of Operations',
    bio: 'Driving operational excellence and strategic implementation across all business functions, Adam ensures seamless delivery of our AI-enhanced ERP solutions. He combines operational expertise with technology innovation to optimize business processes and deliver exceptional client outcomes.',
    image: '/team/adam-pavitt.jpg', // Placeholder
  },
  {
    name: 'Shaun Evertse',
    title: 'E-Commerce, Warehousing & Supply Chain Expert',
    bio: 'Leading digital transformation and supply chain optimization initiatives, Shaun brings CEO-level expertise from Eazybranch and IngenuIT Software Solutions. With deep experience in e-commerce operations, warehousing management, and logistics technology, he helps businesses build resilient, scalable supply chains.',
    image: '/team/shaun-evertse.jpg', // Placeholder
  },
  {
    name: 'Heike van der Westhuizen',
    title: 'ERP Sales Manager',
    bio: 'Making sure every solution fits perfectly, Heike helps businesses find exactly what they need to grow. As our ERP Sales Manager, she specializes in understanding complex business requirements and matching them with the right AI-powered ERP solutions to maximize ROI.',
    image: '/team/heike-van-der-westhuizen.jpg', // Placeholder
  },
  {
    name: 'Brian Bakker',
    title: 'Content and Brand Manager',
    bio: 'Crafting compelling narratives and building brand excellence, Brian ensures that CapLiquify\'s message resonates with finance leaders across all channels. He combines strategic marketing expertise with deep understanding of AI and ERP to create content that educates, engages, and converts.',
    image: '/team/brian-bakker.jpg', // Placeholder
  },
  {
    name: 'Tanya van der Merwe',
    title: 'Finance and Admin Manager',
    bio: 'Ensuring operational excellence and financial integrity, Tanya manages the administrative backbone that supports our ERP implementations. Her expertise in finance and administration ensures that our internal processes are as streamlined as the solutions we deliver.',
    image: '/team/tanya-van-der-merwe.jpg', // Placeholder
  },
  {
    name: 'Sheree Snyman',
    title: 'ERP Project Manager',
    bio: 'Leading successful ERP transformations from start to finish, Sheree brings methodical project management expertise to every implementation. She ensures that complex ERP deployments are delivered on time, within budget, and exceed client expectations.',
    image: '/team/sheree-snyman.jpg', // Placeholder
  },
  {
    name: 'Liza Thompson',
    title: 'Senior Task Coordinator',
    bio: 'Getting things done right, Liza ensures every implementation delivers real results with minimum hassle. As Senior Task Coordinator, she manages complex ERP projects from conception to successful deployment, coordinating cross-functional teams and maintaining project timelines.',
    image: '/team/liza-thompson.jpg', // Placeholder
  },
  {
    name: 'Riaan Ahlers',
    title: 'ERP Sales Specialist',
    bio: 'Connecting businesses with transformational ERP solutions, Riaan brings deep technical knowledge and sales expertise to help organizations understand the true potential of AI-powered ERP systems. He specializes in consultative selling.',
    image: '/team/riaan-ahlers.jpg', // Placeholder
  },
  {
    name: 'Ntiyiso Mahlaule',
    title: 'ERP Consultant',
    bio: 'Delivering expert ERP guidance and implementation support, Ntiyiso combines technical expertise with business acumen to help organizations maximize their ERP investments. His consulting approach focuses on understanding unique business processes.',
    image: '/team/ntiyiso-mahlaule.jpg', // Placeholder
  },
  {
    name: 'Tebogo Mashego',
    title: 'ERP Consultant',
    bio: 'Providing specialized ERP consulting services, Tebogo helps businesses navigate complex system implementations and optimizations. With a focus on user adoption and process improvement, he ensures that ERP solutions drive meaningful business transformation.',
    image: '/team/tebogo-mashego.jpg', // Placeholder
  },
  {
    name: 'Maliaka Frieslaar',
    title: 'Assistant Task Coordinator',
    bio: 'Supporting seamless project execution and client communication, Maliaka brings fresh energy and meticulous attention to detail to our implementation team. She ensures that every project milestone is tracked, documented, and delivered with precision.',
    image: '/team/maliaka-frieslaar.jpg', // Placeholder
  },
]

const STATS = [
  { label: 'ERP Implementations', value: '230+', description: 'Successful transformations across multiple industries' },
  { label: 'Years Experience', value: '20+', description: 'Proven track record in business transformation' },
  { label: 'Global Regions', value: '3', description: 'UK, Europe, and Southern Africa coverage' },
  { label: 'Average ROI', value: '300-500%', description: 'Delivered through our implementations' },
]

const TeamPage = () => {
  return (
    <div className="bg-white">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl font-bold text-white mb-6">
              Meet the Experts Behind
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent"> Your Transformation</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Our world-class team combines decades of ERP expertise with cutting-edge AI innovation to deliver transformational results for finance leaders across the globe.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Proven Track Record of Excellence</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our team's achievements speak for themselves. We've transformed businesses across industries with measurable, lasting results.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl p-8 shadow-lg text-center"
              >
                <div className="text-4xl font-bold text-blue-600 mb-2">{stat.value}</div>
                <div className="text-lg font-semibold text-gray-900 mb-2">{stat.label}</div>
                <div className="text-sm text-gray-600">{stat.description}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Meet the Team Behind Your <span className="text-blue-600">Success</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our world-class team combines decades of ERP expertise with cutting-edge AI innovation to deliver transformational results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {TEAM_MEMBERS.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Placeholder for team member photo */}
                <div className="h-64 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-4xl font-bold text-white">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                  <p className="text-blue-600 font-semibold mb-4">{member.title}</p>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-4">{member.bio}</p>

                  {(member.email || member.phone) && (
                    <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                      {member.email && (
                        <a
                          href={`mailto:${member.email}`}
                          className="text-gray-600 hover:text-blue-600 transition-colors"
                          aria-label={`Email ${member.name}`}
                        >
                          <Mail className="w-5 h-5" />
                        </a>
                      )}
                      {member.phone && (
                        <a
                          href={`tel:${member.phone}`}
                          className="text-gray-600 hover:text-blue-600 transition-colors"
                          aria-label={`Call ${member.name}`}
                        >
                          <Phone className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Finance Operations?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Our team is ready to help you achieve 300-500% ROI with AI-powered ERP solutions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/trial"
              className="inline-flex items-center justify-center px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center px-8 py-3 bg-transparent text-white font-semibold rounded-lg border-2 border-white hover:bg-white/10 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}

// Simple Header Component
const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold text-gray-900">CapLiquify</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link to="/features" className="text-gray-700 hover:text-blue-600">Features</Link>
            <Link to="/pricing" className="text-gray-700 hover:text-blue-600">Pricing</Link>
            <Link to="/blog" className="text-gray-700 hover:text-blue-600">Blog</Link>
            <Link to="/team" className="text-gray-700 hover:text-blue-600">Team</Link>
            <Link to="/contact" className="text-gray-700 hover:text-blue-600">Contact</Link>
            <Link to="/sign-in" className="text-gray-700 hover:text-blue-600">Sign In</Link>
            <Link
              to="/trial"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>
    </header>
  )
}

// Simple Footer Component
const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm">© 2025 CapLiquify. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default TeamPage

