import { motion } from 'motion/react';

// Bloco de skeleton genérico
function Bone({ className }: { className?: string }) {
  return (
    <div className={`bg-slate-200 rounded-lg animate-pulse ${className ?? ''}`} />
  );
}

// Loader para páginas de lista (Explorar, Forum, etc.)
export function ListPageLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-4"
    >
      {/* Header fake */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Bone className="h-7 w-48" />
          <Bone className="h-4 w-72" />
        </div>
        <Bone className="h-9 w-28 rounded-xl" />
      </div>
      {/* Cards fake */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-white border border-slate-100 rounded-xl p-4 flex gap-4">
          <Bone className="w-10 h-10 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Bone className="h-4 w-3/4" />
            <Bone className="h-3 w-1/2" />
            <Bone className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </motion.div>
  );
}

// Loader para página de perfil
export function ProfileLoader() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen">
      {/* Header */}
      <div className="h-48 bg-[#800020]/10 animate-pulse" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-xl p-4 space-y-2">
              <Bone className="h-3 w-24" />
              <Bone className="h-8 w-16" />
            </div>
          ))}
        </div>
        {/* Info card */}
        <div className="bg-white border border-slate-100 rounded-xl p-6 space-y-4">
          <Bone className="h-5 w-40" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Bone key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Loader para o Admin Dashboard
export function DashboardLoader() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen">
      <div className="h-40 bg-gradient-to-r from-[#800020]/20 via-black/10 to-yellow-600/20 animate-pulse" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-xl p-4 space-y-2">
              <Bone className="h-3 w-24" />
              <Bone className="h-10 w-14" />
            </div>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: 7 }).map((_, i) => (
            <Bone key={i} className="h-9 w-28 rounded-full" />
          ))}
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-6 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Bone className="w-10 h-10 rounded-xl shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Bone className="h-4 w-2/3" />
                <Bone className="h-3 w-1/3" />
              </div>
              <Bone className="h-8 w-16 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Loader genérico simples (para páginas pequenas)
export function SimpleLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-3xl mx-auto px-4 py-12 space-y-4"
    >
      <Bone className="h-8 w-56 mb-6" />
      {Array.from({ length: 4 }).map((_, i) => (
        <Bone key={i} className="h-24 rounded-xl" />
      ))}
    </motion.div>
  );
}
