import { create } from "zustand";

export interface PollOption {
    id: string;
    text: string;
    votes: number;
}

export interface Poll {
    id: string;
    question: string;
    options: PollOption[];
    isVisible: boolean;
    isActive: boolean;
    totalVotes: number;
}

interface PollsState {
    polls: Poll[];
    activePollId: string | null;

    // Actions
    addPoll: (question: string, options: string[]) => void;
    removePoll: (id: string) => void;
    vote: (pollId: string, optionId: string) => void;
    setPollVisible: (id: string, visible: boolean) => void;
    setActivePoll: (id: string | null) => void;
    resetPoll: (id: string) => void;
}

export const usePollsStore = create<PollsState>((set) => ({
    polls: [],
    activePollId: null,

    addPoll: (question, optionTexts) => set((state) => ({
        polls: [...state.polls, {
            id: `poll-${Date.now()}`,
            question,
            options: optionTexts.map((text, i) => ({ id: `opt-${i}`, text, votes: 0 })),
            isVisible: false,
            isActive: true,
            totalVotes: 0
        }]
    })),

    removePoll: (id) => set((state) => ({
        polls: state.polls.filter(p => p.id !== id),
        activePollId: state.activePollId === id ? null : state.activePollId
    })),

    vote: (pollId, optionId) => set((state) => ({
        polls: state.polls.map(p => p.id === pollId ? {
            ...p,
            totalVotes: p.totalVotes + 1,
            options: p.options.map(o => o.id === optionId ? { ...o, votes: o.votes + 1 } : o)
        } : p)
    })),

    setPollVisible: (id, visible) => set((state) => ({
        polls: state.polls.map(p => p.id === id ? { ...p, isVisible: visible } : p)
    })),

    setActivePoll: (id) => set({ activePollId: id }),

    resetPoll: (id) => set((state) => ({
        polls: state.polls.map(p => p.id === id ? {
            ...p,
            totalVotes: 0,
            options: p.options.map(o => ({ ...o, votes: 0 }))
        } : p)
    }))
}));
