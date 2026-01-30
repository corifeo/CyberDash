import { motion } from 'framer-motion';
import { ArrowLeft, Home, Calendar, Shield } from 'lucide-react';
import clsx from 'clsx';

/**
 * Dashboard header with navigation
 */
export function Header({
  title,
  subtitle,
  period,
  showBack = false,
  onBack,
  onHome,
  className,
}) {
  return (
    <motion.header
      className={clsx(
        'sticky top-0 z-50',
        'bg-slate-950/80 backdrop-blur-xl',
        'border-b border-slate-800/50',
        className
      )}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo and Title */}
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyber-500 to-cyan-500 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-cyber-400 to-cyan-400 bg-clip-text text-transparent hidden sm:block">
                CyberDash
              </span>
            </div>

            {/* Breadcrumb / Title */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-slate-600">/</span>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-semibold text-white truncate">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-xs text-slate-400 truncate hidden sm:block">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right: Period + Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {period && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/50 rounded-lg text-sm text-slate-300">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{period}</span>
              </div>
            )}

            {showBack && (
              <motion.button
                onClick={onBack}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2 rounded-lg',
                  'bg-slate-800 hover:bg-slate-700',
                  'text-slate-300 hover:text-white',
                  'transition-colors duration-200'
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Back</span>
              </motion.button>
            )}

            <motion.button
              onClick={onHome}
              className={clsx(
                'flex items-center justify-center w-10 h-10 rounded-lg',
                'bg-slate-800 hover:bg-slate-700',
                'text-slate-300 hover:text-white',
                'transition-colors duration-200'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Home"
            >
              <Home className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}

export default Header;
