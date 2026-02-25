"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Menu, 
  Loader2, 
  CheckCircle2, 
  WifiOff, 
  Clock, 
  Maximize2, 
  Minimize2, 
  X 
} from "lucide-react";

interface QuizHeaderProps {
  title: string;
  progress: number;
  autoSaveStatus: "saved" | "saving" | "error";
  isOnline: boolean;
  timeRemaining: number | null;
  isFullScreen: boolean;
  onToggleSidebar: () => void;
  onToggleFullScreen: () => void;
  onExit: () => void;
  violations: number;
}

export function QuizHeader({
  title,
  progress,
  autoSaveStatus,
  isOnline,
  timeRemaining,
  isFullScreen,
  onToggleSidebar,
  onToggleFullScreen,
  onExit,
  violations,
}: QuizHeaderProps) {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours > 0 ? hours + ':' : ''}${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 bg-background border-b z-50">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            {violations > 0 && (
  <Badge variant="destructive">
    Violations: {violations}/3
  </Badge>
)}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="font-semibold hidden sm:inline">{title}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Auto-save status */}
            <div className="flex items-center gap-2 text-sm">
              {autoSaveStatus === "saving" && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-muted-foreground hidden sm:inline">Saving...</span>
                </>
              )}
              {autoSaveStatus === "saved" && (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-green-600 hidden sm:inline">Saved</span>
                </>
              )}
            </div>

            {/* Network status */}
            {!isOnline && (
              <Badge variant="destructive" className="gap-1">
                <WifiOff className="h-3 w-3" />
                Offline
              </Badge>
            )}

            {/* Timer */}
            {timeRemaining !== null && (
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                timeRemaining < 300 ? 'bg-red-100 text-red-700 dark:bg-red-900/20' : 'bg-muted'
              }`}>
                <Clock className="h-4 w-4" />
                <span className="font-mono font-medium">{formatTime(timeRemaining)}</span>
              </div>
            )}

            {/* Full screen toggle */}
            <Button variant="ghost" size="icon" onClick={onToggleFullScreen}>
              {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>

            {/* Exit button */}
            <Button variant="ghost" size="icon" onClick={onExit}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </>
  );
}