import { Outlet, Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import {
  HomeIcon,
  ChatBubbleLeftRightIcon,
  CameraIcon,
  MapPinIcon,
  BookOpenIcon,
  ListBulletIcon,
  AcademicCapIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Home', href: '/', icon: HomeIcon },
  { name: 'Chat', href: '/chat', icon: ChatBubbleLeftRightIcon },
  { name: 'Identify', href: '/identify', icon: CameraIcon },
  { name: 'Locations', href: '/locations', icon: MapPinIcon },
  { name: 'Journal', href: '/journal', icon: BookOpenIcon },
  { name: 'Life List', href: '/lifelist', icon: ListBulletIcon },
  { name: 'Learn', href: '/learn', icon: AcademicCapIcon },
  { name: 'Community', href: '/community', icon: UserGroupIcon },
]

export default function Layout() {
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <motion.div
                whileHover={{ rotate: 10 }}
                className="w-10 h-10 bg-forest-600 rounded-xl flex items-center justify-center shadow-lg"
              >
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
                  <ellipse cx="12" cy="13" rx="5" ry="3.5" fill="currentColor"/>
                  <circle cx="10" cy="12" r="1" fill="white"/>
                  <path d="M17 13l4-1-4 3z" fill="#f97316"/>
                </svg>
              </motion.div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 group-hover:text-forest-600 transition-colors">
                  BirdWatch AI
                </h1>
                <p className="text-xs text-gray-500">Multi-Agent Birding Assistant</p>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href || 
                  (item.href !== '/' && location.pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={clsx(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-forest-100 text-forest-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Mobile menu button */}
            <button className="md:hidden p-2 rounded-lg hover:bg-gray-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-gray-200/50 px-2 py-2">
        <div className="flex justify-around">
          {navigation.slice(0, 6).map((item) => {
            const isActive = location.pathname === item.href ||
              (item.href !== '/' && location.pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                to={item.href}
                className={clsx(
                  'flex flex-col items-center gap-1 p-2 rounded-lg transition-all',
                  isActive ? 'text-forest-600' : 'text-gray-500'
                )}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-xs">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>
    </div>
  )
}
