import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, UserPlus, User, Lock } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { GlassPanel } from '@/components/ui/GlassPanel';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, register } = useAuthStore();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }
    if (password.length < 6) {
      setError('密码长度不能少于6位');
      return;
    }

    setLoading(true);
    try {
      if (tab === 'login') {
        await login(username.trim(), password);
      } else {
        await register(username.trim(), password);
      }
      navigate('/home');
    } catch (err: any) {
      setError(err.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tab === 'login' ? 'bg-[#A78BFA]/20' : 'bg-[#5EEAD4]/20'}`}>
          {tab === 'login' ? <LogIn size={18} className="text-[#A78BFA]" /> : <UserPlus size={18} className="text-[#5EEAD4]" />}
        </div>
        <h1 className="text-xl font-bold text-[#E8E6F0]">
          {tab === 'login' ? '登录' : '注册'}
        </h1>
      </div>

      <GlassPanel>
        {/* Tab Switcher */}
        <div className="flex mb-5 bg-white/[0.04] rounded-lg p-0.5">
          <button
            onClick={() => { setTab('login'); setError(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              tab === 'login'
                ? 'bg-[#A78BFA]/20 text-[#A78BFA]'
                : 'text-[#6B6680] hover:text-[#9D99B5]'
            }`}
          >
            登录
          </button>
          <button
            onClick={() => { setTab('register'); setError(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              tab === 'register'
                ? 'bg-[#5EEAD4]/20 text-[#5EEAD4]'
                : 'text-[#6B6680] hover:text-[#9D99B5]'
            }`}
          >
            注册
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-[#9D99B5] mb-1.5">
              <User size={12} />
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="2-20个字符"
              maxLength={20}
              className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-[#E8E6F0] placeholder-[#6B6680] focus:outline-none focus:border-[#A78BFA]/40"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-[#9D99B5] mb-1.5">
              <Lock size={12} />
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={tab === 'register' ? '至少6位密码' : '输入密码'}
              className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-[#E8E6F0] placeholder-[#6B6680] focus:outline-none focus:border-[#A78BFA]/40"
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-[#FB7185] bg-[#FB7185]/8 border border-[#FB7185]/20 rounded-lg px-3 py-2"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              loading
                ? 'bg-white/[0.06] text-[#6B6680]'
                : tab === 'login'
                  ? 'bg-[#A78BFA]/20 text-[#A78BFA] hover:bg-[#A78BFA]/30'
                  : 'bg-[#5EEAD4]/20 text-[#5EEAD4] hover:bg-[#5EEAD4]/30'
            }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                处理中...
              </>
            ) : tab === 'login' ? (
              <>
                <LogIn size={16} />
                登录
              </>
            ) : (
              <>
                <UserPlus size={16} />
                注册
              </>
            )}
          </motion.button>
        </form>
      </GlassPanel>

      <p className="text-center text-[10px] text-[#6B6680] mt-4">
        {tab === 'login' ? '还没有账号？切换到注册' : '已有账号？切换到登录'}
      </p>
    </div>
  );
}
