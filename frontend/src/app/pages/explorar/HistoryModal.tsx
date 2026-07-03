import { FileText, History, Mic, Play } from "lucide-react";
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui";
import { EmptyState } from "./EmptyState";
import type { Content } from "./types";

interface HistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viewedHistory: Content[];
  openContent: (content: Content) => void;
}

export function HistoryModal({ open, onOpenChange, viewedHistory, openContent }: HistoryModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-amber-600" />
            Histórico de Exploração
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-550">
            Conteúdos abertos nesta sessão.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-3 pr-1">
          {viewedHistory.length === 0 ? (
            <EmptyState
              icon={History}
              title="Histórico vazio."
              description="Os conteúdos que abrires aparecem aqui para retomares a leitura, o vídeo ou o podcast rapidamente."
              tone="action"
              compact
            />
          ) : (
            viewedHistory.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onOpenChange(false);
                  openContent(item);
                }}
                className="w-full rounded-xl border border-[#264653]/10 bg-[#264653]/[0.035] p-3 text-left transition-colors hover:border-[#800020]/20 hover:bg-[#800020]/[0.035]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#800020]/10 text-[#800020]">
                    {item.type === "video" ? <Play className="h-4 w-4" /> : item.type === "podcast" ? <Mic className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-950">{item.title}</p>
                    <p className="mt-0.5 text-[11px] font-medium text-[#264653]">{item.author} · {item.date || "Sem data"}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <DialogFooter className="mt-4 sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
