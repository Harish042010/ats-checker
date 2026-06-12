import React from 'react'
import { useTheme } from '../../context/ThemeContext'
import { HiMenu, HiSun, HiMoon, HiBell } from 'react-icons/hi'

export default function Header({ onMenuClick }) {
  const { darkMode, toggleTheme } = useTheme()

  return (
    <header className="h-16 glass border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 md:px-6 shrink-0">
      <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
        <HiMenu className="w-5 h-5" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center space-x-3">
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl relative">
          <HiBell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <button onClick={toggleTheme} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
          {darkMode ? <HiSun className="w-5 h-5 text-yellow-400" /> : <HiMoon className="w-5 h-5 text-gray-600" />}
        </button>
      </div>
    </header>
  )
}
