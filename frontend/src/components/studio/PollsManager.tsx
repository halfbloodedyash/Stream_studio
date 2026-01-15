"use client";

import { useState } from "react";
import { Plus, Trash2, Eye, EyeOff, BarChart2, MessageSquare, X, Check } from "lucide-react";
import { usePollsStore } from "@/stores/pollsStore";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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
        <div className="flex flex-col gap-6 pb-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                    <BarChart2 className="w-4 h-4 text-primary" />
                    <span>Polls</span>
                </div>
                <Button
                    variant={isCreating ? "ghost" : "outline"}
                    size="sm"
                    className={cn("h-8 rounded-lg gap-1.5 text-[10px] font-bold uppercase tracking-tighter transition-all", isCreating && "text-muted-foreground")}
                    onClick={() => setIsCreating(!isCreating)}
                >
                    {isCreating ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    {isCreating ? "Cancel" : "Create Poll"}
                </Button>
            </div>

            {isCreating && (
                <Card className="p-4 bg-secondary/20 border-border/60 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground/60">Poll Question</Label>
                        <Input
                            className="rounded-xl bg-card border-border/40 focus:ring-primary/20 h-10 text-sm"
                            placeholder="e.g. What should we discuss next?"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                        />
                    </div>

                    <div className="space-y-3">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground/60">Options</Label>
                        <div className="space-y-2">
                            {options.map((opt, i) => (
                                <div key={i} className="flex gap-2 group">
                                    <Input
                                        className="rounded-xl bg-card/50 border-border/30 h-9 text-xs flex-1 transition-all focus:bg-card"
                                        placeholder={`Option ${i + 1}`}
                                        value={opt}
                                        onChange={(e) => updateOption(i, e.target.value)}
                                    />
                                    {options.length > 2 && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                                            onClick={() => removeOption(i)}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {options.length < 5 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full h-8 rounded-lg border border-dashed border-border/60 text-[10px] font-bold text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
                                onClick={addOption}
                            >
                                <Plus className="w-3 h-3 mr-1" /> Add Option
                            </Button>
                        )}
                    </div>

                    <Button
                        className="w-full h-10 rounded-xl font-bold shadow-lg shadow-primary/10"
                        onClick={handleCreate}
                        disabled={!question || options.some(o => !o.trim())}
                    >
                        Launch Poll
                    </Button>
                </Card>
            )}

            <div className="space-y-4">
                {polls.length === 0 && !isCreating && (
                    <div className="py-16 flex flex-col items-center justify-center text-center gap-4 border border-dashed border-border rounded-3xl bg-secondary/5">
                        <div className="bg-muted/10 p-5 rounded-full">
                            <MessageSquare className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-muted-foreground/80 uppercase tracking-widest">No Active Polls</p>
                            <p className="text-[11px] text-muted-foreground/60 max-w-[180px] leading-relaxed">Boost engagement by asking your audience a question.</p>
                        </div>
                    </div>
                )}

                {polls.map(poll => (
                    <Card
                        key={poll.id}
                        className={cn(
                            "group overflow-hidden rounded-2xl border-border/40 transition-all hover:shadow-lg",
                            poll.isVisible && "ring-1 ring-primary/40 border-primary/20 shadow-primary/5"
                        )}
                    >
                        <div className="p-4 space-y-4 bg-card/60">
                            <div className="flex items-start justify-between gap-4">
                                <span className="text-xs font-bold leading-relaxed flex-1">{poll.question}</span>
                                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={cn(
                                                        "h-7 w-7 rounded-lg transition-all",
                                                        poll.isVisible ? "bg-primary text-white hover:bg-primary/80" : "text-muted-foreground hover:bg-secondary"
                                                    )}
                                                    onClick={() => setPollVisible(poll.id, !poll.isVisible)}
                                                >
                                                    {poll.isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>{poll.isVisible ? "Hide from Stream" : "Show on Stream"}</TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-secondary" onClick={() => resetPoll(poll.id)}>
                                                    <BarChart2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Reset Votes</TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => removePoll(poll.id)}>
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Delete Poll</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {poll.options.map(opt => {
                                    const percent = poll.totalVotes > 0 ? (opt.votes / poll.totalVotes) * 100 : 0;
                                    return (
                                        <div key={opt.id} className="space-y-1.5">
                                            <div className="flex justify-between text-[10px] uppercase font-bold tracking-tight">
                                                <span className="text-foreground/80">{opt.text}</span>
                                                <span className="text-primary">{Math.round(percent)}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary/80 rounded-full transition-all duration-500 ease-out"
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest px-2 py-0 border-border/40 text-muted-foreground/60">
                                    {poll.totalVotes} {poll.totalVotes === 1 ? 'Vote' : 'Votes'}
                                </Badge>
                                {poll.isVisible && (
                                    <div className="flex items-center gap-1 text-[9px] font-bold text-primary uppercase animate-pulse">
                                        <Check className="w-3 h-3" /> Visible on Stream
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}

