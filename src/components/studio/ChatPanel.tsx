"use client";

import { useState } from "react";
import { Mic, Users, MessageSquare } from "lucide-react";
import styles from "./ChatPanel.module.css";

interface Message {
  id: string;
  user: string;
  text: string;
  timestamp: Date;
  platform?: "youtube" | "twitch" | "facebook";
}

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      user: "You",
      text: inputText,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputText("");
  };

  return (
    <div className={styles.chatPanel}>
      <div className={styles.messageList}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <MessageSquare size={48} />
            <h4>No Comments Yet</h4>
            <p>Comments from your stream will appear here</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={styles.message}>
              <div className={styles.messageHeader}>
                <span className={styles.userName}>{msg.user}</span>
                <span className={styles.timestamp}>
                  {msg.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <p className={styles.messageText}>{msg.text}</p>
            </div>
          ))
        )}
      </div>

      <form className={styles.inputArea} onSubmit={handleSend}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Reply to chat..."
          className={styles.input}
        />
        <button type="submit" className={styles.sendBtn}>
          Send
        </button>
      </form>
    </div>
  );
}
