import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CameraIcon,
  ChatBubbleLeftRightIcon,
  MapPinIcon,
  BookOpenIcon,
  UserGroupIcon,
  SparklesIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline'

const features = [
  {
    name: 'AI Chat Assistant',
    description: 'Ask anything about birds - identification, behavior, migration, learning tips, and more. Our AI team has you covered.',
    icon: ChatBubbleLeftRightIcon,
    color: 'from-forest-500 to-emerald-600',
    href: '/chat',
    tags: ['Identification', 'Behavior', 'Migration', 'Learning', 'Species Info'],
    featured: true,
  },
  {
    name: 'Photo Identifier',
    description: 'Upload a photo and get instant bird identification with confidence scores',
    icon: CameraIcon,
    color: 'from-emerald-500 to-green-600',
    href: '/identify',
    tags: ['Photo analysis', 'AI-powered', 'Similar species'],
  },
  {
    name: 'Location Scout',
    description: 'Find birding hotspots, rare bird sightings, and create personalized routes',
    icon: MapPinIcon,
    color: 'from-orange-500 to-amber-600',
    href: '/locations',
    tags: ['Hotspots', 'Rare birds', 'Route planning', 'Maps'],
  },
  {
    name: 'Birding Journal',
    description: 'Log sightings and generate beautiful AI-powered trip summaries',
    icon: BookOpenIcon,
    color: 'from-purple-500 to-violet-600',
    href: '/journal',
    tags: ['Sighting logs', 'Trip summaries', 'Notes'],
  },
  {
    name: 'Life List',
    description: 'Track every unique species you\'ve ever seen in your birding journey',
    icon: ListBulletIcon,
    color: 'from-amber-500 to-orange-600',
    href: '/lifelist',
    tags: ['Species tracking', 'Progress', 'Milestones'],
  },
  {
    name: 'Community',
    description: 'Find local birding tours and guided walks',
    icon: UserGroupIcon,
    color: 'from-indigo-500 to-blue-600',
    href: '/community',
    tags: ['Tours & walks', 'Guided outings', 'Audubon field trips'],
  },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <div className="inline-flex items-center gap-2 bg-forest-100 text-forest-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <SparklesIcon className="w-4 h-4" />
          Powered by Multi-Agent AI
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Your AI-Powered
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-forest-600 to-sky-600">
            Birding Companion
          </span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Nine specialized AI agents work together to help you identify, learn, 
          explore, and connect with the birding world like never before.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/chat" className="btn-primary flex items-center gap-2 text-lg px-8 py-4">
            <ChatBubbleLeftRightIcon className="w-6 h-6" />
            Start Chatting
          </Link>
          <Link to="/identify" className="btn-secondary flex items-center gap-2 text-lg px-8 py-4">
            <CameraIcon className="w-6 h-6" />
            Identify a Bird
          </Link>
        </div>
      </motion.div>

      {/* Feature Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {features.map((feature) => (
          <motion.div 
            key={feature.name} 
            variants={item}
            className={feature.featured ? 'md:col-span-2 lg:col-span-1' : ''}
          >
            <Link to={feature.href} className="block agent-card group h-full">
              <div className={`h-2 bg-gradient-to-r ${feature.color}`} />
              <div className="p-6 flex flex-col h-full">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.name}
                </h3>
                <p className="text-gray-600 mb-4 flex-grow">
                  {feature.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {feature.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Stats Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-20 text-center"
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Built with eBird Integration
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto mb-8">
          Powered by real-time data from the world's largest biodiversity database,
          our AI agents have access to millions of bird observations to give you
          accurate, location-aware assistance.
        </p>
        <div className="grid md:grid-cols-4 gap-6 text-center">
          {[
            { label: 'Species Tracked', value: '10,000+' },
            { label: 'Observations/Year', value: '200M+' },
            { label: 'Global Hotspots', value: '1M+' },
            { label: 'AI Agents', value: '9' },
          ].map((stat) => (
            <div key={stat.label} className="glass-panel p-6">
              <div className="text-3xl font-bold text-forest-600 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
