'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Layout } from '@/components/Layout';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { chatWithCopilot } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { formatCurrency, cn } from '@/lib/utils';
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  Calculator,
  Trash2,
  Copy,
  Check,
  ArrowUpRight,
  MessageSquare,
  X,
  ChevronLeft,
} from 'lucide-react';
import { ChatMessage } from '@/types';

const sampleQuestions = [
  "What's my total revenue for the last quarter?",
  "Show me the trend in net income over time",
  "Why did my gross margin drop in Q3?",
  "Calculate my average monthly burn rate",
  "What are the biggest risks in my financial data?",
  "How many months of runway do I have?",
];

export default function ChatPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentDataset, datasets, chatMessages, setChatMessages, addChatMessage, setCurrentDataset } = useAppStore();
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDatasetSelector, setShowDatasetSelector] = useState(false);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(
    searchParams.get('dataset') || currentDataset?.id || null
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-select dataset from URL param
  useEffect(() => {
    const datasetParam = searchParams.get('dataset');
    if (datasetParam && datasetParam !== selectedDatasetId) {
      const dataset = datasets.find(d => d.id === datasetParam);
      if (dataset) {
        setSelectedDatasetId(datasetParam);
        setCurrentDataset(dataset);
      }
    }
  }, [searchParams, datasets, selectedDatasetId, setCurrentDataset]);

  const selectedDataset = datasets.find(d => d.id === selectedDatasetId);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, scrollToBottom]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !selectedDatasetId || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
      datasetId: selectedDatasetId,
    };

    addChatMessage(userMessage);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatWithCopilot(currentInput, selectedDatasetId, chatMessages);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString(),
        datasetId: selectedDatasetId,
      };
      
      addChatMessage(assistantMessage);
    } catch (error) {
      toast.error('Failed to get response');
      // Remove the user message on error
      setChatMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSampleQuestion = (question: string) => {
    setInput(question);
    handleSend();
  };

  const handleClearChat = () => {
    setChatMessages([]);
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
  };

  const formatMessage = (content: string) => {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
      .replace(/\n/g, '<br />');
  };

  if (!selectedDataset) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto py-12 text-center">
          <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Select a Dataset</h2>
          <p className="text-gray-600 mb-6">Choose a financial dataset to start chatting with your AI copilot</p>
          <Link href="/upload" className="inline-flex items-center gap-2">
            <Button size="lg">
              <MessageSquare className="w-4 h-4" />
              Upload & Analyze First
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 text-gray-400 hover:text-gray-600">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">AI Financial Copilot</h1>
              <p className="text-sm text-gray-500">{selectedDataset.fileName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="purple" size="sm" dot>
              {selectedDataset.data.length} data points
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => setShowDatasetSelector(true)}>
              <MessageSquare className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClearChat} disabled={chatMessages.length === 0}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-6 px-4 pb-4">
          <AnimatePresence mode="popLayout">
            {chatMessages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center h-full text-center text-gray-500"
              >
                <Sparkles className="w-16 h-16 text-purple-200 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
                <p className="text-sm mb-6 max-w-xs">Ask me anything about your financial data — trends, calculations, risks, or insights.</p>
                <div className="flex flex-wrap gap-2 justify-center max-w-md">
                  {sampleQuestions.map((q, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="text-left w-auto"
                      onClick={() => handleSampleQuestion(q)}
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              </motion.div>
            ) : (
              chatMessages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn('flex gap-3', message.role === 'user' ? 'flex-row-reverse' : '')}
                >
                  <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0', 
                    message.role === 'user' ? 'bg-primary-100' : 'bg-purple-100'
                  )}>
                    {message.role === 'user' ? (
                      <User className={cn('w-4 h-4', 'text-primary-600')} />
                    ) : (
                      <Bot className={cn('w-4 h-4', 'text-purple-600')} />
                    )}
                  </div>
                  
                  <div className={cn('flex-1 max-w-[85%]', message.role === 'user' ? 'text-right' : '')}>
                    <div className={cn(
                      'inline-block px-4 py-2.5 rounded-2xl text-sm',
                      message.role === 'user'
                        ? 'bg-primary-600 text-white rounded-tr-sm'
                        : 'bg-gray-100 text-gray-900 rounded-tl-sm'
                    )}>
                      <div dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }} />
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1.5 opacity-50 hover:opacity-100 transition-opacity">
                      <span className="text-xs text-gray-500">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {message.role === 'assistant' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-6 text-xs gap-1"
                          onClick={() => handleCopyMessage(message.content)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
          
          <div ref={messagesEndRef} />
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-2.5">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-4 bg-white rounded-b-xl">
          <form onSubmit={handleSend} className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about your financial data..."
              className="flex-1 min-h-[48px] max-h-32 px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              disabled={isLoading || !selectedDatasetId}
              rows={1}
            />
            <Button
              type="submit"
              disabled={!input.trim() || !selectedDatasetId || isLoading}
              className="h-12 w-12 rounded-xl p-0"
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </form>
          
          <p className="text-xs text-gray-500 text-center mt-2">
            Powered by Gemini AI • Your data stays private •{' '}
            <span className="text-primary-600 font-medium">{selectedDataset.data.length} records in context</span>
          </p>
        </div>
      </div>

      {/* Dataset Selector Modal */}
      <AnimatePresence>
        {showDatasetSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowDatasetSelector(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl max-w-md w-full p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Switch Dataset</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowDatasetSelector(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {datasets.map((dataset) => (
                  <button
                    key={dataset.id}
                    onClick={() => {
                      setSelectedDatasetId(dataset.id);
                      setCurrentDataset(dataset);
                      setChatMessages([]);
                      setShowDatasetSelector(false);
                      router.push(`/chat?dataset=${dataset.id}`);
                    }}
                    className={cn(
                      'w-full p-3 rounded-xl text-left transition-colors border-2 flex items-center gap-3',
                      selectedDatasetId === dataset.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-100 hover:border-gray-200'
                    )}
                  >
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center',
                      dataset.fileType === 'pdf' ? 'bg-red-100' : 'bg-green-100'
                    )}>
                      {dataset.fileType === 'pdf' ? (
                        <FileText className="w-5 h-5 text-red-600" />
                      ) : (
                        <FileText className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{dataset.fileName}</p>
                      <p className="text-xs text-gray-500">
                        {dataset.data.length} records • Quality: {dataset.qualityScore}/100
                      </p>
                    </div>
                    {selectedDatasetId === dataset.id && (
                      <Check className="w-5 h-5 text-primary-600" />
                    )}
                  </button>
                ))}
              </div>
              
              {datasets.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p>No datasets yet. Upload one to get started.</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}

// Import missing icons
import { FileText } from 'lucide-react';
import Link from 'next/link';