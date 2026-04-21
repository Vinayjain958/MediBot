import { useState, useRef, useEffect, ChangeEvent, FormEvent } from "react";
import { 
  Send, 
  Bot, 
  User, 
  Image as ImageIcon, 
  FileAudio, 
  Moon, 
  Sun,
  Paperclip,
  X,
  Stethoscope,
  Activity,
  Copy,
  RefreshCw,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Markdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachment?: {
    type: "image" | "audio";
    base64: string;
    name: string;
  };
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I am MediBot, your AI medical assistant. How can I help you today? You can ask me medical questions or share an image or audio clip for context."
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<{ type: "image" | "audio"; base64: string; name: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      const type = file.type.startsWith("image/") ? "image" : "audio";
      
      // We take the pure base64 part just in case, but data URI is fine too.
      // Usually NVIDIA API likes raw base64 or you just put it in prompt. Data URI lets us render it easily.
      setAttachment({
        type,
        base64: base64String,
        name: file.name
      });
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const askBot = async (history: Message[]) => {
    setIsLoading(true);
    try {
      const apiMessages = history.map(m => ({
        role: m.role,
        content: m.role === "user" && m.attachment 
          ? `${m.content}\n\n[Attached File: ${m.attachment.name}]\n[Base64 Data: ${m.attachment.base64.split(",")[1] || m.attachment.base64}]`
          : m.content
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      const assistantMsg = data.choices?.[0]?.message?.content || "No response received.";
      
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: assistantMsg
      }]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Sorry, there was an error processing your request: ${err.message}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async (msgId: string) => {
    if (isLoading) return;
    const msgIndex = messages.findIndex(m => m.id === msgId);
    if (msgIndex === -1) return;
    
    // Find the nearest preceding user message
    let userMsgIndex = msgIndex - 1;
    while (userMsgIndex >= 0 && messages[userMsgIndex].role !== "user") {
      userMsgIndex--;
    }
    
    // Trim memory up to that user prompt and re-ask
    const historySlice = messages.slice(0, userMsgIndex + 1);
    if (historySlice.length === 0) return;
    
    setMessages(historySlice);
    askBot(historySlice);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !attachment) return;

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      attachment: attachment || undefined
    };

    const newHistory = [...messages, newUserMsg];
    setMessages(newHistory);
    setInput("");
    setAttachment(null);
    
    askBot(newHistory);
  };

  return (
    <div className={`h-screen w-screen flex flex-col p-4 font-sans overflow-hidden transition-colors duration-300 ${isDark ? 'medical-grid-dark text-slate-50' : 'medical-grid-light text-slate-900'}`}>
      
      {/* Header */}
      <header className={`h-16 flex items-center justify-between px-4 sm:px-6 rounded-2xl mb-4 shrink-0 shadow-xl transition-colors max-w-5xl mx-auto w-full ${isDark ? 'glass-dark' : 'glass-light'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
            <Stethoscope size={24} />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight">MediBot</h1>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-blue-400' : 'text-blue-600'} flex items-center gap-1`}>
              <Activity size={10} className="text-emerald-500" />
              Active
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex p-1 justify-center rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
            <button 
              onClick={() => setIsDark(true)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${isDark ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Dark
            </button>
            <button 
              onClick={() => setIsDark(false)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${!isDark ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}
            >
              Light
            </button>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className={`flex-1 flex flex-col max-w-5xl mx-auto w-full rounded-2xl overflow-hidden shadow-2xl min-h-0 transition-colors ${isDark ? 'glass-dark' : 'glass-light'}`}>
        <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto relative min-h-0">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                key={msg.id} 
                className={`flex gap-4 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                {/* Avatar */}
                <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                  msg.role === "user" 
                  ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white')
                  : (isDark ? 'bg-slate-800 text-blue-400 border border-slate-700' : 'bg-white text-blue-600 border border-slate-200')
                }`}>
                  {msg.role === "user" ? <User size={20} /> : <Bot size={20} />}
                </div>

                {/* Message Bubble */}
                <div className={`flex flex-col gap-2 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div className={`p-4 ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-2xl rounded-tr-none shadow-lg shadow-blue-900/20"
                      : (isDark ? 'bg-slate-800 text-slate-200 rounded-2xl rounded-tl-none border border-slate-700 shadow-sm' : 'bg-white text-slate-700 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm')
                  }`}>
                    {msg.attachment && (
                      <div className="mb-3">
                        {msg.attachment.type === "image" ? (
                          <div className="relative rounded-lg overflow-hidden border border-white/10 shadow-sm backdrop-blur-sm bg-black/5">
                            <img src={msg.attachment.base64} alt="Attached" className="max-w-xs max-h-60 object-contain rounded-lg" />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 bg-black/10 px-3 py-2 rounded-lg text-sm border border-white/10 backdrop-blur-sm">
                            <FileAudio size={16} />
                            <span className="truncate max-w-[150px] font-medium">{msg.attachment.name}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {msg.role === "assistant" ? (
                      <div className={`markdown-body text-sm leading-relaxed prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap leading-relaxed text-sm">
                        {msg.content}
                      </div>
                    )}
                  </div>
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-2 mt-1 px-1">
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {copiedId === msg.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        {copiedId === msg.id ? "Copied" : "Copy"}
                      </button>
                      <button
                        onClick={() => handleRegenerate(msg.id)}
                        disabled={isLoading}
                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                          isDark ? 'text-slate-400 hover:text-blue-400 hover:bg-slate-800' : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                        Regenerate
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="mr-auto flex gap-4 max-w-[85%]"
            >
              <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                isDark ? 'bg-slate-800 text-blue-400 border border-slate-700' : 'bg-white text-blue-600 border border-slate-200'
              }`}>
                <Bot size={20} />
              </div>
              <div className={`p-4 rounded-2xl rounded-tl-none flex items-center gap-2 ${
                isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200 shadow-sm'
              }`}>
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className={`p-4 border-t flex-shrink-0 z-10 transition-colors flex flex-col justify-end ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50/50 border-slate-200'}`}>
          <div className="w-full">
            {attachment && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`mb-3 p-3 rounded-xl flex items-center justify-between border w-fit pr-10 relative ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700 shadow-sm'
                }`}
              >
              <div className="flex items-center gap-2">
                {attachment.type === "image" ? <ImageIcon size={18} className="text-blue-500" /> : <FileAudio size={18} className="text-purple-500" />}
                <span className="text-sm font-medium truncate max-w-[200px]">{attachment.name}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setAttachment(null)}
                className="absolute right-2 p-1 rounded-full hover:bg-slate-400/20 transition-colors"
              >
                <X size={16} />
              </button>
            </motion.div>
          )}

            <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
              <div className={`flex-1 flex items-end gap-2 rounded-xl border p-1 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/50 transition-all ${
                isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
              }`}>
                <button
                  type="button"
                  onClick={handleFileClick}
                  className={`p-3 shrink-0 rounded-xl transition-colors ${
                    isDark ? 'text-slate-400 hover:bg-slate-700 hover:text-blue-400' : 'text-slate-500 hover:bg-slate-100 hover:text-blue-600'
                  }`}
                  title="Attach image or mp3"
                >
                <Paperclip size={20} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,audio/mp3,audio/mpeg"
                className="hidden" 
              />
              
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (input.trim() || attachment) handleSubmit(e);
                    }
                  }}
                  placeholder="Describe symptoms or ask for advice..."
                  className={`flex-1 max-h-48 min-h-[48px] py-3 pr-3 resize-none bg-transparent outline-none text-sm w-full ${
                    isDark ? 'placeholder:text-slate-500 text-slate-200' : 'placeholder:text-slate-400 text-slate-800'
                  }`}
                  rows={1}
                />
              </div>
              
              <button
                type="submit"
                disabled={isLoading || (!input.trim() && !attachment)}
                className="shrink-0 h-[52px] px-6 rounded-xl bg-blue-600 font-bold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-500 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center text-white"
              >
                Send Query
              </button>
            </form>
            <div className={`text-center mt-3 text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              MediBot is an AI assistant. Information provided is for educational purposes and not a substitute for professional medical advice.
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}
