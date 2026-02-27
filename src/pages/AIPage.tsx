import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { callNetlifyFunction } from "@/utils/netlifyFunctions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SendHorizonal, Bot, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  role: "assistant" | "user";
  content: string;
  timestamp: Date;
}

const AIPage = () => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const savedMessages = sessionStorage.getItem("ai-chat-messages");
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    } else {
      resetChat();
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem("ai-chat-messages", JSON.stringify(messages));
  }, [messages]);
  
  let pfp: string | null = null;

  if (currentUser?.email === "thor@gmail.com") {
    pfp = "/thor1.png";
  } else if (currentUser.email === "batman@gmail.com") {
    pfp = "/bat.png";
  } else {
    pfp = null; // No image -> AvatarFallback will be triggered
  }

  const resetChat = () => {
    const introMessage: Message = {
      role: "assistant",
      content: "Hello, Master! I’m Alfred, your financial assistant. Ask me anything about your transactions or finances!",
      timestamp: new Date(),
    };
    setMessages([introMessage]);
    setInput("");
    sessionStorage.setItem("ai-chat-messages", JSON.stringify([introMessage]));
  };
  

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading || !currentUser) return;
    
    const userMessage = input.trim();
    setInput("");
    
    const newUserMessage: Message = {
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const response = await callNetlifyFunction("aiFinanceAssistant", {
        message: userMessage,
        userId: currentUser.uid,
        previousMessages: messages
      });
      
      const data = response.data as any;

      if (data.success && data.reply) {
        const newAIMessage: Message = {
          role: "assistant",
          content: data.reply,
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, newAIMessage]);
      } else {
        throw new Error("Invalid response from assistant");
      }
    } catch (error) {
      console.error("Error calling AI assistant:", error);
      toast.error("Failed to get a response. Please try again.");
    } finally {
      setIsLoading(false);
      
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto w-full h-[calc(100dvh-8rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] md:h-[calc(100vh)] flex flex-col md:p-6 gap-2 md:gap-4">
        <div className="bg-card border rounded-lg shadow-sm flex-1 flex flex-col overflow-hidden p-0 pt-4">
        <div className="flex justify-between items-center px-4 md:px-4 pb-2 border-b">
          <h2 className="text-sm md:text-base font-semibold">Alfred - Your Finance Assistant</h2>
          <Button
          variant="outline"
          size="sm"
          onClick={resetChat}
          className="text-xs md:text-sm"
          >
          New Chat
          </Button>
          </div>
          
          <ScrollArea 
            className="flex-1 px-3 md:px-4"
            ref={scrollAreaRef}
          >
            <div className="flex flex-col gap-3 md:gap-4 max-w-8xl mx-auto pt-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-2.5 md:gap-3 ${
                    message.role === "assistant" ? "" : "flex-row-reverse"
                  }`}
                >
                  <Avatar className="h-7 w-7 md:h-8 md:w-8 mt-1 flex-shrink-0">
                    {message.role === "assistant" ? (
                      <>
                        <AvatarImage src="/alfred1.png" />
                      </>
                    ) : (
                      <>
                      <AvatarImage src={pfp} />
                      <AvatarFallback>
                        <User className="h-3 w-3 md:h-4 md:w-4" />
                      </AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  
                  <div
                    className={`rounded-lg px-2 py-1 md:p-2.5 text-sm max-w-[80%] md:max-w-[91.5%] ${
                      message.role === "assistant"
                        ? "bg-muted"
                        : "bg-primary text-primary-foreground ml-auto"
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                    <div
                      className={`text-[10px] md:text-xs mt-1 ${
                        message.role === "assistant"
                          ? "text-muted-foreground"
                          : "text-primary-foreground/80"
                      }`}
                    >
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-2 md:gap-3">
                  <Avatar className="h-7 w-7 md:h-8 md:w-8 mt-1">
                    <AvatarImage src="/Lg.png" />
                    <AvatarFallback>
                      <Bot className="h-3 w-3 md:h-4 md:w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg p-2.5 md:p-3 flex items-center gap-2">
                    <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="rounded-none p-3">
            <form onSubmit={handleSubmit} className="max-w-8xl mx-auto">
              <div className="relative flex items-center align-center">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me about your finances..."
                  className="w-full pr-12 min-h-[44px] md:min-h-[50px] resize-none text-sm md:text-base"
                  disabled={isLoading}
                  rows={1}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="absolute right-2 bottom-2 h-7 w-7 md:h-8 md:w-8"
                  disabled={isLoading || !input.trim()}
                >
                  <SendHorizonal className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AIPage;