import React, { useEffect, useState } from "react";
import { Check, Edit3, Flag, MessageCircle, MoreVertical, Send, ThumbsUp, Trash2 } from "lucide-react";
import api, { resolveUploadUrl } from "../../services/api";
import type { Comment, Content, Toast } from "./types";

type StateSetter<T> = React.Dispatch<React.SetStateAction<T>>;

interface CommentSectionProps {
  contentId: string;
  isDarkMode?: boolean;
  isAuthenticated: boolean;
  contents: Content[];
  likedComments: Record<string, boolean>;
  hiddenComments: Record<string, boolean>;
  commentsLoadedByContent: Record<string, boolean>;
  openCommentMenuId: string | null;
  setAuthAction: StateSetter<string>;
  setShowAuthPrompt: StateSetter<boolean>;
  setCommentsForContent: (contentId: string, newComments: Comment[]) => void;
  setCommentsLoadedByContent: StateSetter<Record<string, boolean>>;
  setLikedComments: StateSetter<Record<string, boolean>>;
  setContents: StateSetter<Content[]>;
  setSelectedContentForReport: StateSetter<Content | null>;
  setIsReportModalOpen: StateSetter<boolean>;
  setOpenCommentMenuId: StateSetter<string | null>;
  getCommentsForContent: (contentId: string) => Comment[];
  createClientId: (prefix: string) => string;
  getCurrentUserName: () => string;
  getCurrentUserInitials: () => string;
  handleEditComment: (contentId: string, id: string) => void;
  handleDeleteCommentClick: (contentId: string, id: string) => void;
  handleSaveEditComment: (contentId: string, id: string) => void | Promise<void>;
  handleCancelEditComment: (contentId: string, id: string) => void;
  handleAndShowError: (error: unknown, context: string) => void;
  triggerToast: (title: string, desc: string, type?: Toast["type"], action?: Toast["action"]) => void;
}

export function CommentSection({
  contentId,
  isDarkMode = false,
  isAuthenticated,
  contents,
  likedComments,
  hiddenComments,
  commentsLoadedByContent,
  openCommentMenuId,
  setAuthAction,
  setShowAuthPrompt,
  setCommentsForContent,
  setCommentsLoadedByContent,
  setLikedComments,
  setContents,
  setSelectedContentForReport,
  setIsReportModalOpen,
  setOpenCommentMenuId,
  getCommentsForContent,
  createClientId,
  getCurrentUserName,
  getCurrentUserInitials,
  handleEditComment,
  handleDeleteCommentClick,
  handleSaveEditComment,
  handleCancelEditComment,
  handleAndShowError,
  triggerToast,
}: CommentSectionProps) {
  const comments = getCommentsForContent(contentId);
  const [localNewComment, setLocalNewComment] = useState("");
  const [localReplyText, setLocalReplyText] = useState("");
  const [localReplyingTo, setLocalReplyingTo] = useState<string | null>(null);
  const [aDenunciar, setADenunciar] = useState<string | null>(null);

  async function denunciarComentario(commentId: string) {
    if (aDenunciar) return;
    setADenunciar(commentId);
    try {
      await api.post(`/content/comments/${commentId}/report`);
      triggerToast("Comentário denunciado", "A nossa equipa vai analisar este comentário.", "success");
    } catch (error) {
      handleAndShowError(error, "denunciar comentário");
    } finally {
      setADenunciar(null);
    }
  }

  const syncCommentsFromApi = async () => {
    const response = await api.get(`/content/${contentId}/comments`);
    const loadedComments: Comment[] = response.data.comentarios || [];
    setCommentsForContent(contentId, loadedComments);
    setCommentsLoadedByContent(prev => ({ ...prev, [contentId]: true }));

    const liked: Record<string, boolean> = {};
    const collectLiked = (items: Comment[]) => {
      items.forEach((item) => {
        if (item.likedByCurrentUser) liked[item.id] = true;
        if (item.replies?.length) collectLiked(item.replies);
      });
    };
    collectLiked(loadedComments);
    setLikedComments(prev => ({ ...prev, ...liked }));

    return loadedComments;
  };

  useEffect(() => {
    const loadComments = async () => {
      if (commentsLoadedByContent[contentId]) return;
      try {
        await syncCommentsFromApi();
      } catch (error) {
        console.error('Erro ao carregar comentários:', error);
      }
    };
    loadComments();
  }, [contentId, commentsLoadedByContent[contentId]]);

  const handleLocalAddComment = async () => {
    // Verificar se o utilizador está autenticado
    if (!isAuthenticated) {
      setAuthAction('comentar em conteúdos');
      setShowAuthPrompt(true);
      return;
    }

    const commentText = localNewComment.trim();
    if (commentText) {
      const comment: Comment = {
        id: createClientId("comment"),
        author: getCurrentUserName(),
        avatar: getCurrentUserInitials(),
        text: commentText,
        time: "Agora mesmo",
        likes: 0,
        createdByCurrentUser: true,
      };
      setCommentsForContent(contentId, [comment, ...comments]);
      setLocalNewComment("");
      try {
        await api.post(`/content/${contentId}/comments`, {
          comentario: commentText,
          comentarioPaiId: null,
        });
        await syncCommentsFromApi();
        setContents(prev => prev.map(c => c.id === contentId ? { ...c, commentsCount: c.commentsCount + 1 } : c));
      } catch (error) {
        setCommentsForContent(contentId, comments);
        handleAndShowError(error, "Publicar comentário");
        return;
      }
      triggerToast("💬 Comentário publicado", "A tua opinião foi partilhada com a comunidade.", "success");
    }
  };

  const handleLocalReply = (commentId: string) => {
    // Verificar se o utilizador está autenticado
    if (!isAuthenticated) {
      setAuthAction('responder a comentários');
      setShowAuthPrompt(true);
      return;
    }
    setLocalReplyingTo(localReplyingTo === commentId ? null : commentId);
    setLocalReplyText("");
  };

  const handleLocalAddReply = async (parentCommentId: string) => {
    // Verificar se o utilizador está autenticado
    if (!isAuthenticated) {
      setAuthAction('responder a comentários');
      setShowAuthPrompt(true);
      return;
    }

    const replyText = localReplyText.trim();
    if (replyText) {
      const reply: Comment = {
        id: createClientId("comment"),
        author: getCurrentUserName(),
        avatar: getCurrentUserInitials(),
        text: replyText,
        time: "Agora mesmo",
        likes: 0,
        createdByCurrentUser: true,
      };

      const addReplyRecursive = (commentsList: Comment[]): Comment[] => {
        return commentsList.map((c) => {
          if (c.id === parentCommentId) {
            return { ...c, replies: [...(c.replies || []), reply] };
          }
          if (c.replies && c.replies.length > 0) {
            return { ...c, replies: addReplyRecursive(c.replies) };
          }
          return c;
        });
      };

      setCommentsForContent(contentId, addReplyRecursive(comments));
      setLocalReplyText("");
      setLocalReplyingTo(null);
      try {
        await api.post(`/content/${contentId}/comments`, {
          comentario: replyText,
          comentarioPaiId: parentCommentId,
        });
        await syncCommentsFromApi();
        setContents(prev => prev.map(c => c.id === contentId ? { ...c, commentsCount: c.commentsCount + 1 } : c));
      } catch (error) {
        setCommentsForContent(contentId, comments);
        handleAndShowError(error, "Publicar resposta");
        return;
      }
      triggerToast("↩️ Resposta enviada", "A tua resposta foi adicionada à conversa.", "success");
    }
  };

  const handleLocalLikeComment = async (commentId: string) => {
    // Verificar se o utilizador está autenticado
    if (!isAuthenticated) {
      setAuthAction('dar like em comentários');
      setShowAuthPrompt(true);
      return;
    }
    const willLike = !likedComments[commentId];
    const updateLikeRecursive = (commentsList: Comment[]): Comment[] => {
      return commentsList.map((item) => {
        if (item.id === commentId) {
          return { ...item, likes: Math.max(0, item.likes + (willLike ? 1 : -1)) };
        }
        if (item.replies?.length) {
          return { ...item, replies: updateLikeRecursive(item.replies) };
        }
        return item;
      });
    };
    setLikedComments((prev) => ({ ...prev, [commentId]: willLike }));
    setCommentsForContent(contentId, updateLikeRecursive(comments));
    try {
      const response = await api.post(`/content/comments/${commentId}/like`, { liked: willLike });
      const syncLikeRecursive = (commentsList: Comment[]): Comment[] => {
        return commentsList.map((item) => {
          if (item.id === commentId) return { ...item, likes: Number(response.data.likes ?? item.likes) };
          if (item.replies?.length) return { ...item, replies: syncLikeRecursive(item.replies) };
          return item;
        });
      };
      setCommentsForContent(contentId, syncLikeRecursive(getCommentsForContent(contentId)));
    } catch (error) {
      setLikedComments((prev) => ({ ...prev, [commentId]: !willLike }));
      setCommentsForContent(contentId, comments);
      handleAndShowError(error, "Persistir like do comentário");
    }
  };

  const renderCommentTree = (comment: Comment, depth: number = 0) => {
    const isOwnComment = Boolean(comment.createdByCurrentUser);

    return (
      <div key={comment.id}>
        <div 
          className="flex gap-3 group"
          style={{ paddingLeft: depth > 0 ? `${depth * 16}px` : undefined }}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 shadow-sm overflow-hidden">
            {comment.avatarUrl ? (
              <img src={resolveUploadUrl(comment.avatarUrl)} alt={comment.author} className="w-full h-full object-cover" />
            ) : (
              comment.avatar
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-semibold ${isDarkMode ? 'text-slate-800' : 'text-slate-900'} text-sm`}>{comment.author}</span>
              <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-slate-500'}`}>{comment.time}</span>
              <div className="relative ml-auto opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenCommentMenuId(openCommentMenuId === comment.id ? null : comment.id);
                  }}
                  aria-label={`Abrir opções do comentário de ${comment.author}`}
                  aria-haspopup="menu"
                  aria-expanded={openCommentMenuId === comment.id}
                  className={`p-1 rounded-md transition-colors ${isDarkMode ? 'text-gray-500 hover:bg-gray-100' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
                  title="Mais opções"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {openCommentMenuId === comment.id && (
                  <div role="menu" className="absolute right-0 top-7 w-32 bg-white border border-slate-200 rounded-lg shadow-xl z-40 overflow-hidden">
                    {isOwnComment ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditComment(contentId, comment.id);
                            setOpenCommentMenuId(null);
                          }}
                          role="menuitem"
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <Edit3 className="w-4 h-4" />
                          Editar
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCommentClick(contentId, comment.id);
                            setOpenCommentMenuId(null);
                          }}
                          role="menuitem"
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#800020] hover:bg-[#FFF2F2]"
                        >
                          <Trash2 className="w-4 h-4" />
                          Eliminar
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isAuthenticated) {
                            setAuthAction('denunciar comentários');
                            setShowAuthPrompt(true);
                            setOpenCommentMenuId(null);
                            return;
                          }
                          setOpenCommentMenuId(null);
                          void denunciarComentario(comment.id);
                        }}
                        disabled={aDenunciar === comment.id}
                        role="menuitem"
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#800020] hover:bg-[#FFF2F2]"
                      >
                        <Flag className="w-4 h-4" />
                        {aDenunciar === comment.id ? 'A denunciar...' : 'Denunciar'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {comment.isEditing ? (
              <div className="mb-3">
                <textarea
                  aria-label={`Editar comentário de ${comment.author}`}
                  value={comment.editText}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    const updateEditTextRecursive = (commentsList: Comment[]): Comment[] => {
                      return commentsList.map((item) => {
                        if (item.id === comment.id) {
                          return { ...item, editText: newValue };
                        }
                        if (item.replies && item.replies.length > 0) {
                          return { ...item, replies: updateEditTextRecursive(item.replies) };
                        }
                        return item;
                      });
                    };
                    setCommentsForContent(contentId, updateEditTextRecursive(comments));
                  }}
                  rows={2}
                  className={`w-full resize-none text-sm ${isDarkMode ? 'bg-gray-50 border-gray-300 text-slate-800' : 'border-slate-200'} focus:border-blue-300 rounded-lg p-2`}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveEditComment(contentId, comment.id);
                      }}
                    className="text-xs bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition-colors flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Guardar
                  </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelEditComment(contentId, comment.id);
                      }}
                    className="text-xs bg-slate-500 text-white px-3 py-1 rounded-md hover:bg-slate-600 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <p className={`text-sm ${isDarkMode ? 'text-slate-700' : 'text-slate-700'} mb-2 leading-relaxed`}>{comment.text}</p>
            )}
            
            <div className="flex items-center gap-4 opacity-70 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLocalLikeComment(comment.id);
                }}
                aria-label={likedComments[comment.id] ? `Remover gosto do comentário de ${comment.author}` : `Gostar do comentário de ${comment.author}`}
                className={`flex items-center gap-1 text-xs transition-all ${
                  likedComments[comment.id] ? "text-[#800020] font-semibold" : `${isDarkMode ? 'text-gray-600 hover:text-purple-600' : 'text-slate-500 hover:text-[#800020]'}`
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" fill={likedComments[comment.id] ? "currentColor" : "none"} />
                <span>{comment.likes}</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLocalReply(comment.id);
                }}
                className={`text-xs ${isDarkMode ? 'text-gray-600 hover:text-purple-600' : 'text-slate-500 hover:text-[#800020]'} transition-colors font-medium`}
              >
                Responder
              </button>
            </div>

            {localReplyingTo === comment.id && (
              <div className={`mt-4 ${isDarkMode ? 'bg-gray-50' : 'bg-slate-50'} rounded-lg p-4 border ${isDarkMode ? 'border-gray-200' : 'border-slate-200'}`}>
                <textarea
                  aria-label={`Resposta ao comentário de ${comment.author}`}
                  placeholder="Escreva sua resposta..."
                  value={localReplyText}
                  onChange={(e) => setLocalReplyText(e.target.value)}
                  rows={2}
                  className={`w-full resize-none text-sm ${isDarkMode ? 'bg-white border-gray-300 text-slate-800' : 'border-slate-200'} focus:border-[#FBBCB8] rounded-lg p-2`}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocalReplyingTo(null);
                    }}
                    className={`px-3 py-1.5 text-xs ${isDarkMode ? 'text-gray-600 hover:bg-gray-200' : 'text-slate-600 hover:bg-slate-200'} rounded transition-colors`}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLocalAddReply(comment.id);
                    }}
                    disabled={!localReplyText.trim()}
                    className="px-3 py-1.5 bg-[#800020] text-white text-xs rounded-md hover:bg-[#5C0016] disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Responder
                  </button>
                </div>
              </div>
            )}

            {comment.replies && comment.replies.length > 0 && (
              <div className={`mt-4 ${depth === 0 ? 'pl-0' : ''} space-y-3`}>
                {comment.replies.map((reply) => renderCommentTree(reply, depth + 1))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`mt-8 pt-6 border-t ${isDarkMode ? 'border-gray-200' : 'border-slate-200'}`}>
      <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-slate-800' : 'text-slate-900'} mb-6 flex items-center gap-2`}>
        <MessageCircle className={`w-5 h-5 ${isDarkMode ? 'text-purple-600' : 'text-[#800020]'}`} />
        Comentários ({comments.length})
      </h3>

      <div className="flex gap-3 mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-[#800020] to-[#5C0016] rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 shadow-sm">
          {getCurrentUserInitials()}
        </div>
        <div className="flex-1">
          <div className="relative">
            <textarea
              aria-label="Novo comentário"
              placeholder={isAuthenticated ? "Adicione um comentário..." : "Faça login para comentar..."}
              value={localNewComment}
              onChange={(e) => setLocalNewComment(e.target.value)}
              rows={3}
              className={`w-full resize-none pr-12 ${isDarkMode ? 'bg-gray-50 border-gray-300 text-slate-800 placeholder:text-gray-400' : 'border-slate-200'} focus:border-[#FBBCB8] focus:ring focus:ring-[#FDD5D5] transition-all rounded-xl text-sm p-3`}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              disabled={!isAuthenticated}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLocalAddComment();
              }}
              aria-label="Enviar comentário"
              disabled={!localNewComment.trim() || !isAuthenticated}
              className="absolute bottom-3 right-3 bg-[#800020] text-white p-2 rounded-lg hover:bg-[#5C0016] disabled:bg-slate-300 disabled:cursor-not-allowed transition-all transform hover:scale-105"
              title={!isAuthenticated ? "Faça login para comentar" : ""}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {comments
          .filter((comment) => !hiddenComments[comment.id])
          .map((comment) => renderCommentTree(comment, 0))}
      </div>
    </div>
  );
}
