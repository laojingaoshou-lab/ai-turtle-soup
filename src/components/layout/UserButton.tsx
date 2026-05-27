import { useNavigate } from 'react-router-dom';
import { User, Circle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export function UserButton() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return null;

  return (
    <button
      onClick={() => navigate(isAuthenticated ? '/account' : '/login')}
      className="fixed top-4 right-4 z-50 w-9 h-9 rounded-full bg-[#0F0B2E]/70 backdrop-blur-md border border-white/[0.08] flex items-center justify-center hover:border-white/[0.16] transition-colors"
      title={isAuthenticated ? '我的账号' : '登录'}
    >
      {isAuthenticated ? (
        <>
          <User size={16} className="text-[#A78BFA]" fill="#A78BFA" fillOpacity={0.2} />
          <Circle size={6} className="absolute top-0 right-0 text-[#5EEAD4]" fill="#5EEAD4" />
        </>
      ) : (
        <User size={16} className="text-[#6B6680]" />
      )}
    </button>
  );
}
