import { useEffect, useState } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import { Theme } from '@radix-ui/themes'
import * as Switch from '@radix-ui/react-switch'
import { MoonIcon, SunIcon } from '@radix-ui/react-icons'
import Home from './pages/Home'

function App() {
  const [appearance, setAppearance] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('appearance') as 'light' | 'dark' | null
    if (stored) return stored
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  })

  useEffect(() => {
    localStorage.setItem('appearance', appearance)
    const root = document.documentElement
    if (appearance === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [appearance])

  return (
    <Theme appearance={appearance}>
      <div className="min-h-screen bg-white text-gray-900 dark:bg-neutral-900 dark:text-neutral-100">
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/70 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/70">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <nav className="flex items-center gap-4">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-600 hover:text-indigo-600 dark:text-neutral-300 dark:hover:text-indigo-400'
                  }`
                }
              >
                首页
              </NavLink>
            </nav>
            <div className="flex items-center gap-2">
              <SunIcon className="h-4 w-4 text-gray-600 dark:text-neutral-300" />
              <Switch.Root
                checked={appearance === 'dark'}
                onCheckedChange={(v) => setAppearance(v ? 'dark' : 'light')}
                className="relative h-[22px] w-[42px] cursor-pointer rounded-full bg-gray-300 outline-none transition-colors data-[state=checked]:bg-indigo-600"
              >
                <Switch.Thumb className="block h-[18px] w-[18px] translate-x-[2px] rounded-full bg-white shadow transition-transform will-change-transform data-[state=checked]:translate-x-[22px]" />
              </Switch.Root>
              <MoonIcon className="h-4 w-4 text-gray-600 dark:text-neutral-300" />
            </div>
          </div>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </main>
      </div>
    </Theme>
  )
}

export default App
