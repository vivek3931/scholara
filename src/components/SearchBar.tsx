import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';

export default function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const searchRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        if (query === '') {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [query]);

  const handleClose = () => {
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={searchRef} className="flex items-center">
      {/* Search Icon Button - Always Visible */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="relative p-2.5 rounded-full border border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/5 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Search size={20} className="text-amber-400" />
      </motion.button>

      {/* Expandable Input Container */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0, marginLeft: 0 }}
            animate={{ width: 'auto', opacity: 1, marginLeft: 8 }}
            exit={{ width: 0, opacity: 0, marginLeft: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2">
              {/* Input Field */}
              <motion.input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search resources..."
                className="bg-transparent border-b border-amber-500/30 outline-none text-sm text-gray-200 placeholder-gray-500 focus:border-amber-500/60 transition-colors py-1 min-w-[200px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.1 }}
              />

              {/* Close Button */}
              <motion.button
                onClick={handleClose}
                className="p-1 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <X size={16} className="text-gray-400 hover:text-gray-200" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}