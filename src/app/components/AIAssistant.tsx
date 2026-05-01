import { useState, useEffect, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "./ui/sheet";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Send, Bot, User, AlertCircle, Maximize2, Minimize2 } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: number;
  sender: 'bot' | 'user';
  text: string;
  timestamp: Date;
}

interface AIAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIAssistant({ open, onOpenChange }: AIAssistantProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'bot',
      text: 'Hola. Analizo datos de AEMET y reportes recientes. ¿Qué zona te preocupa hoy?',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickSuggestions = [
    'Riesgo en Pirineos hoy',
    'Previsión finde Benasque',
    'Explicar alertas actuales',
  ];

  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText || !user?.id) return;

    /* Limpiar error anterior */
    setError(null);

    /* Agregar mensaje del usuario */
    const userMessage: Message = {
      id: messages.length + 1,
      sender: 'user',
      text: messageText,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInputValue("");

    /* Mostrar estado de carga */
    setIsTyping(true);

    try {
      /* Llamar a la API real */
      const apiUrlBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      const apiUrlChat = `${apiUrlBase}/chat/ask`;
      console.log('📡 Llamando a API Chat:', apiUrlChat);

      const response = await fetch(apiUrlChat, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuario_id: user.id,
          pregunta: messageText,
          contexto: 'Usuario interactuando desde MapViewer',
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Respuesta recibida de Gemini API:', data);

      /* Crear mensaje del bot con respuesta real */
      const botMessage: Message = {
        id: messages.length + 2,
        sender: 'bot',
        text: data.data?.respuesta || 'No pude procesar tu pregunta. Intenta de nuevo.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);

    } catch (err) {
      console.error('❌ Error en AIAssistant:', err);
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg);

      /* Mostrar mensaje de error al usuario */
      const errorMessage: Message = {
        id: messages.length + 2,
        sender: 'bot',
        text: `Perdón, tuve un problema: ${errorMsg}. Por favor intenta de nuevo.`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={`p-0 flex flex-col transition-all duration-300 ease-in-out border-l shadow-2xl ${isExpanded
          ? "w-full sm:w-[85vw] md:w-[700px] lg:w-[900px]"
          : "w-full sm:w-[400px] md:w-[450px]"
          }`}
      >
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b flex-shrink-0 flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <SheetTitle className="text-lg">Asistente Inteligente</SheetTitle>
              <SheetDescription className="sr-only">
                Chat con el asistente de IA para consultas sobre condiciones meteorológicas y riesgos en montaña
              </SheetDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="hidden sm:flex text-slate-500 hover:text-slate-900"
            title={isExpanded ? "Contraer" : "Expandir"}
          >
            {isExpanded ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </SheetHeader>

        {/* Error Banner */}
        {error && (
          <div className="px-6 py-3 bg-red-50 border-b border-red-200 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {/* Auth Warning */}
        {!user?.id && (
          <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-200 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">Debes estar autenticado para usar el chat</div>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
              >
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${message.sender === 'bot'
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                    : 'bg-slate-700'
                    }`}
                >
                  {message.sender === 'bot' ? (
                    <Bot className="h-4 w-4 text-white" />
                  ) : (
                    <User className="h-4 w-4 text-white" />
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`flex-1 max-w-[80%] ${message.sender === 'user' ? 'text-right' : 'text-left'
                    }`}
                >
                  <div
                    className={`inline-block px-4 py-2 rounded-2xl ${message.sender === 'bot'
                      ? 'bg-slate-100 text-slate-900'
                      : 'bg-blue-600 text-white'
                      }`}
                  >
                    {message.sender === 'bot' ? (
                      <div className="markdown-content text-sm leading-relaxed">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: (props) => <p className="mb-2 last:mb-0">{props.children}</p>,
                            strong: (props) => <span className="font-bold">{props.children}</span>,
                            em: (props) => <span className="italic">{props.children}</span>,
                            ul: (props) => <ul className="list-disc ml-4 mb-2">{props.children}</ul>,
                            ol: (props) => <ol className="list-decimal ml-4 mb-2">{props.children}</ol>,
                            li: (props) => <li className="mb-1">{props.children}</li>,
                            a: (props) => <a href={props.href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">{props.children}</a>,
                          }}
                        >
                          {message.text}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed">{message.text}</p>
                    )}
                  </div>
                  <div className="mt-1 px-1">
                    <span className="text-xs text-slate-500">
                      {message.timestamp.toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3 flex-row">
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600`}
                >
                  <Bot className="h-4 w-4 text-white" />
                </div>

                {/* Message Bubble with animated dots */}
                <div className={`flex-1 max-w-[80%] text-left`}>
                  <div className={`inline-block px-4 py-3 rounded-2xl bg-slate-100 text-slate-900`}>
                    <div className="flex gap-1">
                      <motion.span
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: 0 }}
                        className="w-1.5 h-1.5 bg-slate-600 rounded-full"
                      />
                      <motion.span
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                        className="w-1.5 h-1.5 bg-slate-600 rounded-full"
                      />
                      <motion.span
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                        className="w-1.5 h-1.5 bg-slate-600 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Quick Suggestions */}
        <div className="px-6 py-3 border-t bg-slate-50 flex-shrink-0">
          <div className="flex flex-wrap gap-2">
            {quickSuggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs h-8 rounded-full bg-white hover:bg-slate-100 border-slate-300"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="px-6 py-4 border-t bg-white flex-shrink-0">
          <div className="flex gap-2">
            <Input
              placeholder={user?.id ? "Pregunta a la IA..." : "Inicia sesión para usar el chat"}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={!user?.id || isTyping}
              className="flex-1"
            />
            <Button
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || !user?.id || isTyping}
              className="bg-blue-600 hover:bg-blue-700"
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Los datos son referenciales. Verifica siempre fuentes oficiales.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}