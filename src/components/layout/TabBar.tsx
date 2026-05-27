import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, BookOpen, Users, Settings } from 'lucide-react';

const tabs = [
  { path: '/home', icon: Home, label: '首页' },
  { path: '/scripts', icon: BookOpen, label: '剧本' },
  { path: '/lobby', icon: Users, label: '联机' },
  { path: '/settings', icon: Settings, label: '设置' },
];

export function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const currentTab = tabs.findIndex((t) => location.pathname.startsWith(t.path));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0F0B2E]/85 backdrop-blur-xl border-t border-white/[0.06] h-16 flex items-center justify-around px-2 safe-area-bottom">
      {tabs.map((tab, i) => {
        const isActive = currentTab === i;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className="relative flex flex-col items-center justify-center gap-0.5 py-1 px-4 transition-colors"
          >
            <tab.icon
              size={20}
              strokeWidth={isActive ? 2.5 : 1.5}
              className={isActive ? 'text-[#A78BFA]' : 'text-[#6B6680]'}
            />
            <span
              className={`text-[10px] font-medium ${
                isActive ? 'text-[#A78BFA]' : 'text-[#6B6680]'
              }`}
            >
              {tab.label}
            </span>
            {isActive && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-[#A78BFA]"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
