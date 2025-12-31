import React, { useState } from 'react';
import {
  BarChart3, ClipboardList, MessageSquare, Sparkles,
  Plus, Trash2, Play, Pause, CheckCircle, Users,
  ThumbsUp, Send, Edit3, Eye, EyeOff, HelpCircle, User, AlertTriangle
} from 'lucide-react';
import { Poll, Survey, Language, Message, Question } from '../../types';
// import { suggestPollQuestion, generateSurvey } from '../../services/geminiService'; // Disabled - Gemini not needed

interface EngagementTabProps {
  poll: Poll | null;
  survey: Survey | null;
  updatePoll: (p: Poll | null) => void;
  updateSurvey: (s: Survey | null) => void;
  messages: Message[];
  questions: Question[];
  lang: Language;
}

export const EngagementTab: React.FC<EngagementTabProps> = ({
  poll,
  survey,
  updatePoll,
  updateSurvey,
  messages,
  questions,
  lang
}) => {
  const [aiLoading, setAiLoading] = useState(false);
  const [surveyLoading, setSurveyLoading] = useState(false);
  const [editingPoll, setEditingPoll] = useState(false);
  const [newPollQuestion, setNewPollQuestion] = useState(poll?.question || '');
  const [newPollOptions, setNewPollOptions] = useState(poll?.options?.map(o => o.text) || ['', '', '']);

  const handleGeneratePoll = async () => {
    setAiLoading(true);
    // const context = "We are discussing enterprise live streaming technology, including low latency protocols, CDN optimization, and viewer engagement strategies.";
    // const result = await suggestPollQuestion(context, lang); // Disabled - Gemini not needed

    // Placeholder poll instead of AI-generated
    alert(lang === 'pt' ? 'Funcionalidade de IA desativada. Por favor, crie a enquete manualmente.' : 'AI functionality disabled. Please create the poll manually.');
    setAiLoading(false);
  };

  const handleGenerateSurvey = async () => {
    setSurveyLoading(true);
    // const result = await generateSurvey("Enterprise Live Streaming Platform Demo", lang); // Disabled - Gemini not needed

    // Placeholder survey instead of AI-generated
    alert(lang === 'pt' ? 'Funcionalidade de IA desativada. Por favor, crie a pesquisa manualmente.' : 'AI functionality disabled. Please create the survey manually.');
    setSurveyLoading(false);
  };

  const handleSavePoll = () => {
    const newPoll: Poll = {
      id: poll?.id || `poll-${Date.now()}`,
      question: newPollQuestion,
      isActive: poll?.isActive ?? true,
      totalVotes: poll?.totalVotes || 0,
      options: newPollOptions.map((text, i) => ({
        id: poll?.options[i]?.id || `o${i}`,
        text,
        votes: poll?.options[i]?.votes || 0
      }))
    };
    updatePoll(newPoll);
    setEditingPoll(false);
  };

  const handleAddOption = () => {
    setNewPollOptions([...newPollOptions, '']);
  };

  const handleRemoveOption = (index: number) => {
    setNewPollOptions(newPollOptions.filter((_, i) => i !== index));
  };

  const togglePollActive = () => {
    if (poll) {
      updatePoll({ ...poll, isActive: !poll.isActive });
    }
  };

  const toggleSurveyActive = () => {
    if (survey) {
      updateSurvey({ ...survey, isActive: !survey.isActive });
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Tools Header */}
      <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-lg border border-indigo-500/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">AI Engagement Director</h3>
              <p className="text-[10px] text-slate-400">Generate polls and surveys using AI based on stream context</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleGeneratePoll}
              disabled={aiLoading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <BarChart3 className={`w-4 h-4 ${aiLoading ? 'animate-spin' : ''}`} />
              {aiLoading ? 'Generating...' : 'Generate Poll'}
            </button>
            <button
              onClick={handleGenerateSurvey}
              disabled={surveyLoading}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <ClipboardList className={`w-4 h-4 ${surveyLoading ? 'animate-spin' : ''}`} />
              {surveyLoading ? 'Generating...' : 'Generate Survey'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Active Poll */}
        <div className="col-span-12 lg:col-span-6">
          <div className="bg-[#14151f] rounded-lg border border-slate-800 overflow-hidden h-full">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-bold text-white">Active Poll</span>
                {poll?.isActive && (
                  <span className="flex items-center gap-1 text-[10px] text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                    LIVE
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingPoll(!editingPoll)}
                  className="p-1.5 text-slate-400 hover:text-white transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={togglePollActive}
                  className={`p-1.5 rounded transition-colors ${poll?.isActive
                      ? 'text-red-400 hover:bg-red-500/10'
                      : 'text-emerald-400 hover:bg-emerald-500/10'
                    }`}
                >
                  {poll?.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="p-4">
              {editingPoll ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-2">Question</label>
                    <input
                      type="text"
                      value={newPollQuestion}
                      onChange={(e) => setNewPollQuestion(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-2">Options</label>
                    <div className="space-y-2">
                      {newPollOptions.map((opt, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const updated = [...newPollOptions];
                              updated[i] = e.target.value;
                              setNewPollOptions(updated);
                            }}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                            placeholder={`Option ${i + 1}`}
                          />
                          {newPollOptions.length > 2 && (
                            <button
                              onClick={() => handleRemoveOption(i)}
                              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleAddOption}
                      className="mt-2 flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Add Option
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSavePoll}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Save Poll
                    </button>
                    <button
                      onClick={() => setEditingPoll(false)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : poll ? (
                <>
                  <h4 className="text-lg font-medium text-white mb-4">{poll.question}</h4>
                  <div className="space-y-3">
                    {poll.options.map((opt) => {
                      const percent = poll.totalVotes > 0
                        ? Math.round((opt.votes / poll.totalVotes) * 100)
                        : 0;
                      return (
                        <div key={opt.id} className="relative">
                          <div
                            className="absolute inset-0 bg-indigo-600/20 rounded-lg transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                          <div className="relative flex items-center justify-between p-3 border border-slate-700 rounded-lg">
                            <span className="text-sm text-white">{opt.text}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400">{opt.votes} votes</span>
                              <span className="text-sm font-bold text-indigo-400">{percent}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                    <span>{poll.totalVotes} total votes</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> 67% participation rate
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center text-slate-500 py-4">
                  <p>No poll created yet. Click edit to create one.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active Survey */}
        <div className="col-span-12 lg:col-span-6">
          <div className="bg-[#14151f] rounded-lg border border-slate-800 overflow-hidden h-full">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-bold text-white">Active Survey</span>
                {survey?.isActive && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" /> Active
                  </span>
                )}
              </div>
              <button
                onClick={toggleSurveyActive}
                className={`p-1.5 rounded transition-colors ${survey?.isActive
                    ? 'text-red-400 hover:bg-red-500/10'
                    : 'text-emerald-400 hover:bg-emerald-500/10'
                  }`}
              >
                {survey?.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="p-4">
              {survey ? (
                <>
                  <h4 className="text-lg font-medium text-white mb-4">{survey.title}</h4>
                  <div className="space-y-4">
                    {survey.fields.map((field, i) => (
                      <div key={field.id} className="bg-slate-900/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                            {field.type}
                          </span>
                          <span className="text-sm text-slate-300">{field.question}</span>
                        </div>
                        {field.type === 'RATING' && (
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(n => (
                              <div key={n} className="w-8 h-8 bg-slate-800 rounded flex items-center justify-center text-xs text-slate-500">
                                {n}
                              </div>
                            ))}
                          </div>
                        )}
                        {field.type === 'TEXT' && (
                          <div className="h-12 bg-slate-800 rounded border border-slate-700 flex items-center px-3 text-xs text-slate-600">
                            Text response field...
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                    <span>142 responses collected</span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" /> 4.2 avg rating
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center text-slate-500 py-4">
                  <p>No survey created yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Q&A and Chat Moderation */}
      <div className="grid grid-cols-12 gap-6">

        {/* Q&A Moderation (Left) */}
        <div className="col-span-12 lg:col-span-6">
          <div className="bg-[#14151f] rounded-lg border border-slate-800 h-[500px] flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-white">Q&A Moderation</span>
              </div>
              <span className="text-xs text-slate-400">{questions.length} questions</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {questions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <HelpCircle className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-sm">No questions yet</p>
                </div>
              ) : (
                questions.map((q) => (
                  <div key={q.id} className="bg-slate-900/50 rounded-lg p-3 border border-slate-800 hover:border-slate-700 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-300">{q.userName}</span>
                          <span className="text-[10px] text-slate-500">{new Date(q.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-sm text-white leading-relaxed">{q.text}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center gap-1 text-xs text-indigo-400">
                            <ThumbsUp className="w-3 h-3" /> {q.upvotes}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors" title="Mark as Answered">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Chat Moderation (Right) */}
        <div className="col-span-12 lg:col-span-6">
          <div className="bg-[#14151f] rounded-lg border border-slate-800 h-[500px] flex flex-col">
            <div className="p-4 border-b border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold text-white">Chat Moderation</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-400">
                    <span className="text-white font-mono">{messages.length}</span> msgs
                  </span>
                  <span className="text-slate-400">
                    <span className="text-yellow-400 font-mono">0</span> flagged
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-900/50 rounded p-2 text-center">
                  <div className="text-lg font-mono text-white">99%</div>
                  <div className="text-[9px] text-slate-500">Health</div>
                </div>
                <div className="bg-slate-900/50 rounded p-2 text-center">
                  <div className="text-lg font-mono text-emerald-400">ON</div>
                  <div className="text-[9px] text-slate-500">Auto-Mod</div>
                </div>
                <div className="bg-slate-900/50 rounded p-2 text-center">
                  <div className="text-lg font-mono text-white">0.2s</div>
                  <div className="text-[9px] text-slate-500">Latency</div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <MessageSquare className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-sm">No messages yet</p>
                </div>
              ) : (
                messages.slice().reverse().map((msg) => (
                  <div key={msg.id} className="group flex items-start gap-3 p-2 rounded hover:bg-slate-800/50 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                      {msg.userName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-300 truncate">{msg.userName}</span>
                        <span className="text-[10px] text-slate-500">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-sm text-slate-300 break-words">{msg.text}</p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      <button className="p-1 text-slate-500 hover:text-yellow-400 transition-colors" title="Flag">
                        <AlertTriangle className="w-3 h-3" />
                      </button>
                      <button className="p-1 text-slate-500 hover:text-red-400 transition-colors" title="Delete">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
