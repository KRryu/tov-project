import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';

const CommunitySidebar = () => {
  const menuItems = [
    { path: '/community/forum', label: 'Forum', icon: '💬' },
    { path: '/community/country-groups', label: 'Country Groups', icon: '🌏' },
    { path: '/community/events', label: 'Events & Meetups', icon: '📅' },
    { path: '/community/bridge', label: 'Bridge Club', icon: '🌉', special: true },
    { path: '/community/mentoring', label: 'Mentoring', icon: '🤝' },
  ];

  return (
    <aside className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm shadow-sm 
                    lg:shadow-lg lg:bg-white lg:backdrop-blur-none lg:static 
                    rounded-b-2xl lg:rounded-2xl">
      <nav className="max-w-7xl mx-auto p-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 pl-2 hidden lg:block">
          Category
        </h2>
        <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible scrollbar-hide pb-2 lg:pb-0">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                whitespace-nowrap text-sm lg:text-base relative
                ${isActive 
                  ? item.special 
                    ? 'bg-gradient-to-r from-purple-50 to-blue-50 text-purple-600 font-medium shadow-sm' 
                    : 'bg-blue-50 text-blue-600 font-medium shadow-sm'
                  : item.special 
                    ? 'text-purple-600 hover:bg-purple-50' 
                    : 'text-gray-600 hover:bg-gray-50'
                }
                ${item.special ? 'border border-purple-200' : ''}
              `}
            >
              <span className="text-lg lg:text-xl">{item.icon}</span>
              <span>{item.label}</span>
              {({ isActive }) => isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 hidden lg:block"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                  }}
                />
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </aside>
  );
};

export default CommunitySidebar; 