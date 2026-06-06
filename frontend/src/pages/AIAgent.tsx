import { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Zap, RefreshCw, TrendingUp, Users, AlertTriangle, Calculator } from 'lucide-react';
import type { ChatMessage } from '../types';

const SUGGESTED_PROMPTS = [
  { icon: TrendingUp, label: 'Rentabilité modèles', prompt: 'Analyse la rentabilité de mes modèles. Quels sont les plus et les moins rentables ? Donne-moi des recommandations.' },
  { icon: Users, label: 'Équilibrage de ligne', prompt: 'Comment optimiser l\'équilibrage de ma ligne de production ? Identifie les goulots d\'étranglement et propose des solutions.' },
  { icon: Calculator, label: 'Coût-minute', prompt: 'Analyse mon coût-minute actuel. Est-il cohérent avec les standards du secteur ? Comment l\'améliorer ?' },
  { icon: AlertTriangle, label: 'Alertes stock', prompt: 'Quelles matières premières sont en rupture ou en stock critique ? Que dois-je commander en priorité ?' },
  { icon: Users, label: 'Besoins RH', prompt: 'Combien d\'opérateurs supplémentaires me faut-il pour atteindre mes objectifs de production ? Pour quels postes ?' },
  { icon: Zap, label: 'Étude de cas', prompt: 'Réalise une étude de cas complète de mon atelier : points forts, points faibles, opportunités d\'amélioration et plan d\'action prioritaire.' }
];

function MessageBubble({ message }: { message: ChatMessage & { streaming?: boolean } }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-primary-100' : 'bg-gray-800'}`}>
        {isUser ? <User className="w-4 h-4 text-primary-600" /> : <Bot className="w-4 h-4 text-white" />}
      </div>
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-primary-600 text-white rounded-tr-sm'
            : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
        }`}>
          {message.content}
          {(message as { streaming?: boolean }).streaming && (
            <span className="inline-block w-2 h-4 bg-gray-400 ml-1 animate-pulse rounded-sm" />
          )}
        </div>
      </div>
    </div>
  );
}

export default function AIAgent() {
  const [messages, setMessages] = useState<(ChatMessage & { streaming?: boolean })[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isStreaming) return;
    setError('');

    const userMsg: ChatMessage = { role: 'user', content: content.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsStreaming(true);

    const assistantMsg: ChatMessage & { streaming: boolean } = { role: 'assistant', content: '', streaming: true };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `Erreur ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data) as { text?: string; error?: string };
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) {
              accumulated += parsed.text;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: accumulated, streaming: true };
                return updated;
              });
            }
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message !== 'Unexpected token') {
              throw parseErr;
            }
          }
        }
      }

      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: accumulated, streaming: false };
        return updated;
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de connexion à l\'IA';
      setError(msg);
      setMessages(prev => prev.filter(m => !(m.role === 'assistant' && m.content === '' && (m as { streaming?: boolean }).streaming)));
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Agent IA Atelier</h2>
            <p className="text-xs text-gray-500">Expert en gestion d'atelier de confection</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100">
            <RefreshCw className="w-3.5 h-3.5" /> Nouvelle conversation
          </button>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-hidden flex flex-col card">
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Bonjour ! Comment puis-je vous aider ?</h3>
                <p className="text-sm text-gray-500 max-w-md">Je connais votre atelier en temps réel. Posez-moi des questions sur la production, les coûts, les employés ou demandez une analyse complète.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
                {SUGGESTED_PROMPTS.map(({ icon: Icon, label, prompt }) => (
                  <button
                    key={label}
                    onClick={() => sendMessage(prompt)}
                    className="flex items-center gap-2 p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-medium text-gray-700 transition-colors"
                  >
                    <Icon className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => <MessageBubble key={i} message={msg} />)}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-100 p-4">
          {messages.length > 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
              {SUGGESTED_PROMPTS.slice(0, 3).map(({ icon: Icon, label, prompt }) => (
                <button
                  key={label}
                  onClick={() => sendMessage(prompt)}
                  disabled={isStreaming}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-600 whitespace-nowrap transition-colors disabled:opacity-50"
                >
                  <Icon className="w-3 h-3" /> {label}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-3 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Posez votre question... (Entrée pour envoyer, Maj+Entrée pour nouvelle ligne)"
              rows={1}
              disabled={isStreaming}
              className="flex-1 input resize-none min-h-[42px] max-h-32"
              style={{ height: 'auto' }}
              onInput={e => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = 'auto';
                t.style.height = Math.min(t.scrollHeight, 128) + 'px';
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isStreaming}
              className="btn-primary h-[42px] px-4 flex-shrink-0"
            >
              {isStreaming ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
