"use client";

import { useState } from "react";
import { Plus, Trash2, Eye, EyeOff, BarChart2, MessageSquare } from "lucide-react";
import { usePollsStore } from "@/stores/pollsStore";
import styles from "./PollsManager.module.css";

export function PollsManager() {
    const { polls, addPoll, removePoll, setPollVisible, resetPoll } = usePollsStore();
    const [isCreating, setIsCreating] = useState(false);
    const [question, setQuestion] = useState("");
    const [options, setOptions] = useState(["", ""]);

    const handleCreate = () => {
        if (question && options.every(o => o.trim() !== "")) {
            addPoll(question, options);
            setQuestion("");
            setOptions(["", ""]);
            setIsCreating(false);
        }
    };

    const addOption = () => setOptions([...options, ""]);
    const removeOption = (index: number) => setOptions(options.filter((_, i) => i !== index));
    const updateOption = (index: number, text: string) => {
        const newOptions = [...options];
        newOptions[index] = text;
        setOptions(newOptions);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h4 className={styles.title}>
                    <BarChart2 size={16} />
                    Live Polls
                </h4>
                <button
                    className={styles.addBtn}
                    onClick={() => setIsCreating(!isCreating)}
                >
                    {isCreating ? "Cancel" : "Create Poll"}
                </button>
            </div>

            {isCreating && (
                <div className={styles.createForm}>
                    <input
                        className={styles.input}
                        placeholder="Ask a question..."
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                    />
                    <div className={styles.optionsList}>
                        {options.map((opt, i) => (
                            <div key={i} className={styles.optionInputGroup}>
                                <input
                                    className={styles.smallInput}
                                    placeholder={`Option ${i + 1}`}
                                    value={opt}
                                    onChange={(e) => updateOption(i, e.target.value)}
                                />
                                {options.length > 2 && (
                                    <button className={styles.iconBtn} onClick={() => removeOption(i)}>
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    {options.length < 5 && (
                        <button className={styles.textLink} onClick={addOption}>+ Add option</button>
                    )}
                    <button className={styles.submitBtn} onClick={handleCreate}>Create Poll</button>
                </div>
            )}

            <div className={styles.pollList}>
                {polls.length === 0 && !isCreating && (
                    <div className={styles.emptyState}>
                        <MessageSquare size={32} />
                        <p>No polls yet. Interaction boosts engagement!</p>
                    </div>
                )}
                {polls.map(poll => (
                    <div key={poll.id} className={`${styles.pollCard} ${poll.isVisible ? styles.visible : ""}`}>
                        <div className={styles.pollHeader}>
                            <span className={styles.pollQuestion}>{poll.question}</span>
                            <div className={styles.pollActions}>
                                <button
                                    className={`${styles.actionBtn} ${poll.isVisible ? styles.active : ""}`}
                                    onClick={() => setPollVisible(poll.id, !poll.isVisible)}
                                    title={poll.isVisible ? "Hide from stream" : "Show on stream"}
                                >
                                    {poll.isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                                <button className={styles.actionBtn} onClick={() => resetPoll(poll.id)} title="Reset votes">
                                    <Trash2 size={14} />
                                </button>
                                <button className={styles.actionBtn} onClick={() => removePoll(poll.id)} title="Delete poll">
                                    <Plus size={14} style={{ transform: "rotate(45deg)" }} />
                                </button>
                            </div>
                        </div>
                        <div className={styles.results}>
                            {poll.options.map(opt => {
                                const percent = poll.totalVotes > 0 ? (opt.votes / poll.totalVotes) * 100 : 0;
                                return (
                                    <div key={opt.id} className={styles.resultRow}>
                                        <div className={styles.resultInfo}>
                                            <span>{opt.text}</span>
                                            <span>{Math.round(percent)}%</span>
                                        </div>
                                        <div className={styles.barBg}>
                                            <div className={styles.barFill} style={{ width: `${percent}%` }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className={styles.pollFooter}>
                            <span>{poll.totalVotes} votes</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
