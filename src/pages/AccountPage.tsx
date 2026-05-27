import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, LogOut, Upload, Database, Gamepad2, BookOpen, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useGameStore } from '@/stores/gameStore';
import { useScriptStore } from '@/stores/scriptStore';
import { getRecords, getScripts, saveRecordsBatch, saveScriptsBatch } from '@/services/userApi';
import { GlassPanel } from '@/components/ui/GlassPanel';
import type { GameRecord } from '@/types';

export default function AccountPage() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuthStore();
  const gameHistory = useGameStore((s) => s.gameHistory);
  const customScripts = useScriptStore((s) => s.customScripts);
  const [serverRecords, setServerRecords] = useState<GameRecord[]>([]);
  const [serverScripts, setServerScripts] = useState<{ id: string }[]>([]);
  const [migrating, setMigrating] = useState(false);
  const [migrated, setMigrated] = useState<{ records: number; scripts: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    Promise.all([
      getRecords().then(r => setServerRecords(r.records)).catch(() => setServerRecords([])),
      getScripts().then(r => setServerScripts(r.scripts)).catch(() => setServerScripts([])),
    ]);
  }, [isAuthenticated, navigate]);

  // Find records/scripts that exist locally but NOT on the server
  const unsyncedRecords = useMemo(
    () => {
      const serverIds = new Set(serverRecords.map(r => r.id));
      return gameHistory.filter(r => !serverIds.has(r.id));
    },
    [gameHistory, serverRecords]
  );

  const unsyncedScripts = useMemo(
    () => {
      const serverIds = new Set(serverScripts.map(s => s.id));
      return customScripts.filter(s => !serverIds.has(s.id));
    },
    [customScripts, serverScripts]
  );

  const totalUnsynced = unsyncedRecords.length + unsyncedScripts.length;

  const handleMigrate = async () => {
    setMigrating(true);
    setError(null);
    try {
      const [recordRes, scriptRes] = await Promise.all([
        unsyncedRecords.length > 0
          ? saveRecordsBatch(unsyncedRecords)
          : Promise.resolve({ imported: 0 }),
        unsyncedScripts.length > 0
          ? saveScriptsBatch(unsyncedScripts)
          : Promise.resolve({ imported: 0 }),
      ]);
      setMigrated({ records: recordRes.imported, scripts: scriptRes.imported });
      // Refresh server data
      const [recordsRes, scriptsRes] = await Promise.all([
        getRecords().catch(() => ({ records: [] as GameRecord[] })),
        getScripts().catch(() => ({ scripts: [] as { id: string }[] })),
      ]);
      setServerRecords(recordsRes.records);
      setServerScripts(scriptsRes.scripts);
    } catch (e: any) {
      setError(e?.message || '同步失败');
    } finally {
      setMigrating(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/home');
  };

  if (!user) return null;

  return (
    <div className="max-w-sm mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <User size={22} className="text-[#A78BFA]" />
        <h1 className="text-xl font-bold text-[#E8E6F0]">我的账号</h1>
      </div>

      <GlassPanel className="mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#A78BFA]/20 flex items-center justify-center">
            <span className="text-[#A78BFA] font-bold text-sm">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-bold text-[#E8E6F0]">{user.username}</p>
            <p className="text-[10px] text-[#6B6680]">ID: {user.id}</p>
          </div>
        </div>
      </GlassPanel>

      <GlassPanel className="mb-4">
        <h2 className="text-sm font-bold text-[#E8E6F0] mb-3 flex items-center gap-2">
          <Database size={14} className="text-[#5EEAD4]" />
          云端数据
        </h2>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-white/[0.04] rounded-xl p-3">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Gamepad2 size={14} className="text-[#FBBF24]" />
              <span className="text-lg font-bold text-[#E8E6F0]">{serverRecords.length}</span>
            </div>
            <p className="text-[10px] text-[#6B6680]">游戏记录</p>
          </div>
          <div className="bg-white/[0.04] rounded-xl p-3">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <BookOpen size={14} className="text-[#A78BFA]" />
              <span className="text-lg font-bold text-[#E8E6F0]">{serverScripts.length}</span>
            </div>
            <p className="text-[10px] text-[#6B6680]">自定义剧本</p>
          </div>
        </div>
      </GlassPanel>

      {totalUnsynced > 0 && (
        <GlassPanel className="mb-4">
          <div className="text-center">
            <p className="text-xs text-[#9D99B5] mb-3">
              有 {unsyncedRecords.length} 条游戏记录和 {unsyncedScripts.length} 个自定义剧本尚未同步
            </p>
            {migrated ? (
              <p className="text-xs text-[#5EEAD4] flex items-center justify-center gap-1">
                <CheckCircle size={12} />
                已上传 {migrated.records} 条记录和 {migrated.scripts} 个剧本
              </p>
            ) : error ? (
              <p className="text-xs text-[#FB7185] flex items-center justify-center gap-1 mb-3">
                <AlertCircle size={12} />
                {error}
              </p>
            ) : null}
            {!migrated && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={migrating}
                onClick={handleMigrate}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5EEAD4]/10 text-[#5EEAD4] text-sm font-medium hover:bg-[#5EEAD4]/20 disabled:opacity-50 transition-colors"
              >
                <Upload size={14} className={migrating ? 'animate-bounce' : ''} />
                {migrating ? '上传中...' : '上传到云端'}
              </motion.button>
            )}
          </div>
        </GlassPanel>
      )}

      {totalUnsynced === 0 && serverRecords.length + serverScripts.length > 0 && (
        <GlassPanel className="mb-4">
          <p className="text-xs text-[#5EEAD4] text-center flex items-center justify-center gap-1">
            <CheckCircle size={12} />
            所有数据已同步
          </p>
        </GlassPanel>
      )}

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleLogout}
        className="w-full py-2.5 rounded-xl bg-[#FB7185]/10 text-[#FB7185] text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#FB7185]/20 transition-colors"
      >
        <LogOut size={16} />
        退出登录
      </motion.button>
    </div>
  );
}
