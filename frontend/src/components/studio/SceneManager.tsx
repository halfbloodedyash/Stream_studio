"use client";

import { useState } from "react";
import { Layers, Plus, Trash2, Grid, Layout, Monitor, Users, Mic } from "lucide-react";
import { LAYOUTS, LayoutType } from "@/lib/types/layouts";

// UI Components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Scene {
  id: string;
  name: string;
  layout: LayoutType;
  sources: SceneSource[];
  isActive: boolean;
}

interface SceneSource {
  id: string;
  type: "camera" | "screen" | "image" | "video";
  name: string;
}

interface SceneManagerProps {
  scenes: Scene[];
  activeSceneId: string;
  onSelectScene: (sceneId: string) => void;
  onAddScene: () => void;
  onRemoveScene: (sceneId: string) => void;
  onRenameScene: (sceneId: string, name: string) => void;
  onChangeLayout: (sceneId: string, layout: LayoutType) => void;
}

export function SceneManager({
  scenes,
  activeSceneId,
  onSelectScene,
  onAddScene,
  onRemoveScene,
  onRenameScene,
  onChangeLayout,
}: SceneManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleStartEdit = (scene: Scene) => {
    setEditingId(scene.id);
    setEditName(scene.name);
  };

  const handleFinishEdit = (sceneId: string) => {
    if (editName.trim()) {
      onRenameScene(sceneId, editName.trim());
    }
    setEditingId(null);
    setEditName("");
  };

  const getLayoutIcon = (layout: LayoutType) => {
    switch (layout) {
      case "solo":
        return <Users className="w-4 h-4" />;
      case "duo":
      case "quad":
      case "grid":
        return <Grid className="w-4 h-4" />;
      case "pip":
      case "presentation":
        return <Monitor className="w-4 h-4" />;
      default:
        return <Layout className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Layouts</h3>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={onAddScene}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid gap-3">
        {scenes.map((scene) => {
          const isActive = scene.id === activeSceneId;
          return (
            <Card
              key={scene.id}
              onClick={() => onSelectScene(scene.id)}
              className={cn(
                "group relative flex flex-col gap-3 p-3 transition-all cursor-pointer border-border/40 hover:bg-secondary/40 hover:border-border/80",
                isActive && "ring-2 ring-primary ring-offset-2 ring-offset-background border-primary shadow-lg shadow-primary/5 bg-secondary/50"
              )}
            >
              {/* Scene Header */}
              <div className="flex items-center gap-2">
                <div className={cn(
                  "p-1.5 rounded-lg bg-background border border-border/50",
                  isActive && "bg-primary/10 border-primary/20 text-primary"
                )}>
                  <Layers className="w-3.5 h-3.5" />
                </div>

                {editingId === scene.id ? (
                  <Input
                    className="h-7 text-xs py-0 px-2 flex-1"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => handleFinishEdit(scene.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleFinishEdit(scene.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className="text-xs font-semibold flex-1 truncate"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(scene);
                    }}
                  >
                    {scene.name}
                  </span>
                )}

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveScene(scene.id);
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Scene Thumbnail Preview */}
              <div className="aspect-video bg-background border border-border/20 rounded-lg overflow-hidden relative">
                <div
                  className="absolute inset-2 grid gap-1.5"
                  style={{
                    gridTemplateColumns: `repeat(${scene.layout === "solo" ? 1 :
                      scene.layout === "duo" ? 2 : 2
                      }, 1fr)`,
                    gridTemplateRows: `repeat(${scene.layout === "solo" || scene.layout === "duo" ? 1 : 2
                      }, 1fr)`,
                  }}
                >
                  {Array.from({
                    length:
                      scene.layout === "solo" ? 1 :
                        scene.layout === "duo" ? 2 :
                          scene.layout === "quad" ? 4 :
                            scene.layout === "grid" ? 6 : 2,
                  }).map((_, i) => (
                    <div key={i} className="bg-secondary/60 rounded-sm" />
                  ))}
                </div>
              </div>

              {/* Scene Footer */}
              <div className="flex items-center justify-between">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Badge variant="secondary" className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:bg-muted transition-colors gap-1.5">
                      {getLayoutIcon(scene.layout)}
                      {LAYOUTS[scene.layout].name}
                    </Badge>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48 p-1 rounded-xl">
                    {(Object.entries(LAYOUTS) as [LayoutType, typeof LAYOUTS.solo][]).map(([key, config]) => (
                      <DropdownMenuItem
                        key={key}
                        className={cn(
                          "flex items-center gap-2 rounded-lg py-2 px-3",
                          scene.layout === key && "bg-primary/10 text-primary font-bold"
                        )}
                        onClick={() => onChangeLayout(scene.id, key)}
                      >
                        {getLayoutIcon(key)}
                        <span className="text-xs">{config.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                  {scene.sources.length} SOURCE{scene.sources.length !== 1 ? "S" : ""}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      <Button variant="outline" className="mt-2 border-dashed border-border/60 rounded-xl py-6 gap-2 text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all" onClick={onAddScene}>
        <Plus className="w-4 h-4" />
        Add Layout
      </Button>
    </div>
  );
}
