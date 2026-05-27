import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, ArrowLeft, Send, CheckCircle, Sparkles, Loader2 } from 'lucide-react';
import { useScriptStore } from '@/stores/scriptStore';
import { useAuthStore } from '@/stores/authStore';
import { submitScript } from '@/services/scriptApi';
import { extractScript } from '@/services/aiApi';

export function ImportForm() {
  const navigate = useNavigate();
  const importScript = useScriptStore((s) => s.importScript);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [title, setTitle] = useState('');
  const [scenario, setScenario] = useState('');
  const [truth, setTruth] = useState('');
  const [hints, setHints] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [category, setCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // AI extraction state
  const [rawText, setRawText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');

  const handleExtract = async () => {
    if (!rawText.trim()) return;
    setExtracting(true);
    setExtractError('');
    try {
      const result = await extractScript(rawText.trim());
      setTitle(result.title);
      setScenario(result.scenario);
      setTruth(result.truth);
      setHints(result.hints.join('\n'));
      setDifficulty(result.difficulty);
      if (result.category) setCategory(result.category);
      setRawText('');
    } catch (err: any) {
      setExtractError(err.message || '提炼失败，请重试');
    } finally {
      setExtracting(false);
    }
  };

  const getPayload = () => {
    const hintsArr = hints
      .split('\n')
      .map((h) => h.trim())
      .filter(Boolean);
    return {
      title: title.trim(),
      scenario: scenario.trim(),
      truth: truth.trim(),
      hints: hintsArr.length > 0 ? hintsArr : ['仔细观察场景中的每一处细节。'],
      difficulty,
      category: category.trim() || undefined,
    };
  };

  const handleLocalSave = () => {
    if (!title.trim() || !scenario.trim() || !truth.trim()) return;
    const payload = getPayload();
    const script = importScript(payload);
    navigate(`/script/${script.id}`);
  };

  const handleSubmitForReview = async () => {
    if (!title.trim() || !scenario.trim() || !truth.trim()) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSubmitting(true);
    try {
      const payload = getPayload();
      await submitScript(payload);
      setSubmitSuccess(true);
    } catch (err: any) {
      alert(err.message || '提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <motion.button
          whileHover={{ x: -2 }}
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-white/[0.06] text-[#9D99B5]"
        >
          <ArrowLeft size={20} />
        </motion.button>
        <h1 className="text-xl font-bold text-[#E8E6F0]">导入剧本</h1>
      </div>

      {/* AI Extraction */}
      <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-[#A78BFA]/10 to-[#5EEAD4]/5 border border-[#A78BFA]/20">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-[#A78BFA]" />
          <h2 className="text-sm font-bold text-[#A78BFA]">AI 提炼</h2>
          <span className="text-[10px] text-[#6B6680]">粘贴文字，AI 自动生成剧本</span>
        </div>
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="在此粘贴任意文字内容，AI 将自动提炼为海龟汤剧本...&#10;&#10;可以是故事、新闻、段落，甚至是你的灵感碎片。适合 AI 主持人主持的谜题。"
          rows={5}
          className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-[#E8E6F0] placeholder-[#6B6680] focus:outline-none focus:border-[#A78BFA]/40 resize-none"
        />
        {extractError && (
          <p className="text-xs text-[#FB7185] mt-2">{extractError}</p>
        )}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={handleExtract}
          disabled={!rawText.trim() || extracting}
          className="mt-3 w-full py-2.5 rounded-xl bg-[#A78BFA]/20 text-[#A78BFA] font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#A78BFA]/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {extracting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              AI 提炼中...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              AI 提炼
            </>
          )}
        </motion.button>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[#9D99B5] mb-1.5">标题 *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="给剧本起个名字"
            maxLength={50}
            className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-[#E8E6F0] placeholder-[#6B6680] focus:outline-none focus:border-[#A78BFA]/40"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#9D99B5] mb-1.5">汤面（场景描述）*</label>
          <textarea
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            placeholder="描述玩家看到的场景..."
            rows={4}
            maxLength={500}
            className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-[#E8E6F0] placeholder-[#6B6680] focus:outline-none focus:border-[#A78BFA]/40 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#9D99B5] mb-1.5">汤底（完整真相）*</label>
          <textarea
            value={truth}
            onChange={(e) => setTruth(e.target.value)}
            placeholder="写出完整的真相..."
            rows={4}
            maxLength={1000}
            className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-[#E8E6F0] placeholder-[#6B6680] focus:outline-none focus:border-[#A78BFA]/40 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#9D99B5] mb-1.5">提示（每行一条）</label>
          <textarea
            value={hints}
            onChange={(e) => setHints(e.target.value)}
            placeholder="提示1&#10;提示2&#10;提示3"
            rows={3}
            className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-[#E8E6F0] placeholder-[#6B6680] focus:outline-none focus:border-[#A78BFA]/40 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#9D99B5] mb-1.5">难度</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
              className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-[#E8E6F0] focus:outline-none focus:border-[#A78BFA]/40"
            >
              <option value="easy">简单</option>
              <option value="medium">中等</option>
              <option value="hard">困难</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#9D99B5] mb-1.5">分类</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="如：悬疑、经典"
              maxLength={20}
              className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-[#E8E6F0] placeholder-[#6B6680] focus:outline-none focus:border-[#A78BFA]/40"
            />
          </div>
        </div>

        {submitSuccess ? (
          <div className="p-4 rounded-xl bg-[#5EEAD4]/10 border border-[#5EEAD4]/20 text-center">
            <CheckCircle size={20} className="text-[#5EEAD4] mx-auto mb-2" />
            <p className="text-sm font-medium text-[#5EEAD4]">已提交审核</p>
            <p className="text-xs text-[#6B6680] mt-1">等待管理员审核通过后，将出现在内置剧本中</p>
          </div>
        ) : (
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={handleLocalSave}
              disabled={!title.trim() || !scenario.trim() || !truth.trim()}
              className="flex-1 py-3 rounded-xl bg-white/[0.06] text-[#E8E6F0] font-medium text-sm flex items-center justify-center gap-2 hover:bg-white/[0.1] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Plus size={18} />
              保存到本地
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={handleSubmitForReview}
              disabled={!title.trim() || !scenario.trim() || !truth.trim() || submitting}
              className="flex-1 py-3 rounded-xl bg-[#A78BFA]/15 text-[#A78BFA] font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#A78BFA]/25 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title={isAuthenticated ? '提交到内置剧本库，需管理员审核' : '需先注册登录才能提交'}
            >
              <Send size={16} />
              {submitting ? '提交中...' : isAuthenticated ? '提交审核' : '登录后提交'}
            </motion.button>
          </div>
        )}
      </form>
    </div>
  );
}
