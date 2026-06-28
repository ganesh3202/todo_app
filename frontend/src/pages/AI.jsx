import React, { useState, useRef, useEffect } from 'react';
import { aiAPI } from '../services/api';
import { Bot, Send, User, Zap, Sparkles, Clock, AlertTriangle, Target, BarChart2, RefreshCw } from 'lucide-react';
import './AI.css';

const QUICK_PROMPTS = [
  { icon: '📅', text: "What tasks are due today?" },
  { icon: '⚠️', text: "Show me overdue tasks" },
  { icon: '🔴', text: "Show high priority tasks" },
  { icon: '🎯', text: "Suggest my next task" },
  { icon: '📊', text: "Give me a productivity summary" },
  { icon: '📁', text: "Project status overview" },
];

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text: "Hi! I'm your AI productivity assistant. I can help you track tasks, find overdue items, suggest what to work on next, and give you productivity insights. What would you like to know?",
      time: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const query = text || input.trim();
    if (!query || loading) return;

    const userMsg = { id: Date.now(), role: 'user', text: query, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiAPI.query(query);
      const botMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        text: res.response,
        data: res.data,
        time: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        text: "Sorry, I couldn't process that request. Please try again.",
        time: new Date()
      }]);
    }
    setLoading(false);
  };

  const clearChat = () => {
    setMessages([{
      id: 1, role: 'assistant',
      text: "Chat cleared! How can I help you?",
      time: new Date()
    }]);
  };

  const formatText = (text) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('•')) {
        return <div key={i} className="ai-list-item">{line}</div>;
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return <strong key={i}>{line.slice(2, -2)}</strong>;
      }
      // Handle inline bold
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <div key={i} className={line === '' ? 'ai-spacer' : ''}>
          {parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
        </div>
      );
    });
  };

  return (
    <div className="ai-page page-enter">
      {/* Header */}
      <div className="ai-header glass-card">
        <div className="ai-avatar">
          <Bot size={24} />
          <div className="ai-online-dot" />
        </div>
        <div className="ai-header-info">
          <h2 className="ai-title">TaskFlow AI</h2>
          <p className="ai-subtitle">Your intelligent productivity assistant</p>
        </div>
        <div className="ai-header-badges">
          <span className="ai-badge"><Zap size={12} /> Smart Search</span>
          <span className="ai-badge"><Sparkles size={12} /> Context Aware</span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={clearChat} style={{ marginLeft: 'auto' }}>
          <RefreshCw size={14} /> Clear
        </button>
      </div>

      {/* Quick prompts */}
      <div className="quick-prompts">
        <div className="quick-prompts-label">Quick prompts</div>
        <div className="quick-prompts-grid">
          {QUICK_PROMPTS.map((p, i) => (
            <button key={i} className="quick-prompt-btn" onClick={() => sendMessage(p.text)}>
              <span>{p.icon}</span> {p.text}
            </button>
          ))}
        </div>
      </div>

      {/* Chat messages */}
      <div className="ai-chat glass-card">
        <div className="ai-messages">
          {messages.map(msg => (
            <div key={msg.id} className={`ai-message ${msg.role}`}>
              <div className="message-avatar">
                {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div className="message-bubble">
                <div className="message-text">{formatText(msg.text)}</div>
                {msg.data && msg.data.length > 0 && (
                  <div className="message-data">
                    {msg.data.slice(0, 5).map((item, i) => (
                      <div key={i} className="data-item">
                        <div className={`priority-dot ${item.priority}`} />
                        <div className="data-item-info">
                          <div className="data-item-title">{item.title}</div>
                          {item.dueDate && (
                            <div className="data-item-due">
                              <Clock size={10} /> {new Date(item.dueDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <span className={`badge badge-${item.status}`}>{item.status?.replace('_', ' ')}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="message-time">
                  {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="ai-message assistant">
              <div className="message-avatar"><Bot size={16} /></div>
              <div className="message-bubble">
                <div className="ai-typing">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="ai-input-area">
          <input
            type="text"
            className="ai-input"
            placeholder="Ask anything about your tasks and projects..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            disabled={loading}
          />
          <button className="ai-send-btn" onClick={() => sendMessage()} disabled={!input.trim() || loading}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
