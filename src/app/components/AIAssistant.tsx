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
import { Send, Bot, User } from "lucide-react";
import { motion } from "motion/react";

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

  const handleSend = (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText) return;

    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      sender: 'user',
      text: messageText,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInputValue("");

    // Simulate bot response after a short delay
    setIsTyping(true);
    setTimeout(() => {
      const botMessage: Message = {
        id: messages.length + 2,
        sender: 'bot',
        text: generateBotResponse(messageText),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 800);
  };

  const generateBotResponse = (userText: string): string => {
    const lowerText = userText.toLowerCase();
    
    if (lowerText.includes('pirineos')) {
      return 'Según datos de AEMET, los Pirineos tienen riesgo moderado de aludes hoy. Zonas como Benasque y Baqueira presentan niveles 3/5. Te recomiendo consultar los reportes de usuarios en el mapa para información en tiempo real.';
    } else if (lowerText.includes('benasque')) {
      return 'Este fin de semana en Benasque se esperan temperaturas de -5°C a 2°C con nevadas intermitentes. El riesgo de aludes es moderado (3/5). Condiciones ideales para esquí de travesía con precauci��n.';
    } else if (lowerText.includes('alertas') || lowerText.includes('alerta')) {
      return 'Las alertas de AEMET indican zonas con condiciones peligrosas. El nivel va de 1 (riesgo bajo) a 5 (riesgo muy alto). Actualmente hay 3 alertas activas en zonas de alta montaña del Pirineo Central.';
    } else {
      return 'Entiendo tu pregunta. Estoy analizando datos meteorológicos y reportes de usuarios. ¿Podrías ser más específico sobre la zona o el tipo de información que necesitas?';
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
      <SheetContent side="right" className="w-full sm:w-[400px] md:w-[450px] p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b flex-shrink-0">
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
        </SheetHeader>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                    message.sender === 'bot'
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
                  className={`flex-1 max-w-[80%] ${
                    message.sender === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  <div
                    className={`inline-block px-4 py-2 rounded-2xl ${
                      message.sender === 'bot'
                        ? 'bg-slate-100 text-slate-900'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.text}</p>
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
              placeholder="Pregunta a la IA..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button
              onClick={() => handleSend()}
              disabled={!inputValue.trim()}
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