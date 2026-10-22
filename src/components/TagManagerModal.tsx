import React, { useState } from 'react';
import { 
  X, 
  Tag, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { PackagingItem } from '../types';

interface TagManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tags: string[];
  items: PackagingItem[];
  onAddTag: (tagName: string) => void;
  onEditTag: (oldName: string, newName: string) => void;
  onDeleteTag: (tagName: string) => void;
}

export const TagManagerModal: React.FC<TagManagerModalProps> = ({
  isOpen,
  onClose,
  tags,
  items,
  onAddTag,
  onEditTag,
  onDeleteTag,
}) => {
  const [newTagInput, setNewTagInput] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [deletingTag, setDeletingTag] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    const trimmed = newTagInput.trim();
    if (!trimmed) return;

    if (tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg(`El tag "${trimmed}" ya existe.`);
      return;
    }

    onAddTag(trimmed);
    setNewTagInput('');
  };

  const handleStartEdit = (tag: string) => {
    setEditingTag(tag);
    setEditValue(tag);
    setErrorMsg(null);
  };

  const handleSaveEdit = (oldTag: string) => {
    setErrorMsg(null);
    const trimmed = editValue.trim();
    if (!trimmed) {
      setEditingTag(null);
      return;
    }
    if (trimmed.toLowerCase() !== oldTag.toLowerCase() && tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg(`Ya existe otro tag llamado "${trimmed}".`);
      return;
    }
    onEditTag(oldTag, trimmed);
    setEditingTag(null);
  };

  const getTagUsageCount = (tagName: string) => {
    return items.filter((item) => item.tags?.includes(tagName)).length;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-600/10 text-red-500 rounded-xl">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Gestionar Tags</h3>
              <p className="text-xs text-neutral-400">Arquetipos y formatos de miniaturas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreate} className="flex gap-2">
            <input
              type="text"
              value={newTagInput}
              onChange={(e) => {
                setNewTagInput(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Ej: Drama, Clickbait, 3D, Vlog..."
              className="flex-1 bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-neutral-500 outline-none"
            />
            <button
              type="submit"
              disabled={!newTagInput.trim()}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar</span>
            </button>
          </form>

          <div className="space-y-2 pt-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              Tags activos ({tags.length})
            </div>

            <div className="space-y-1.5">
              {tags.map((tag) => {
                const count = getTagUsageCount(tag);
                const isEditing = editingTag === tag;

                return (
                  <div
                    key={tag}
                    className="flex items-center justify-between p-2.5 bg-neutral-950/70 border border-neutral-800/80 rounded-xl hover:border-neutral-700 transition-all group"
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1 mr-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(tag);
                            if (e.key === 'Escape') setEditingTag(null);
                          }}
                          autoFocus
                          className="flex-1 bg-neutral-900 border border-neutral-600 rounded-lg px-2.5 py-1 text-xs text-white outline-none"
                        />
                        <button
                          onClick={() => handleSaveEdit(tag)}
                          className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingTag(null)}
                          className="p-1.5 text-neutral-400 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-800/80 text-neutral-200 border border-neutral-700/60">
                            #{tag}
                          </span>
                          <span className="text-[11px] text-neutral-400">
                            {count} {count === 1 ? 'video' : 'videos'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {deletingTag === tag ? (
                            <div className="flex items-center gap-1 text-[11px] bg-red-950/80 border border-red-500/50 rounded-lg px-2 py-0.5">
                              <span className="text-red-300">¿Eliminar?</span>
                              <button
                                onClick={() => {
                                  onDeleteTag(tag);
                                  setDeletingTag(null);
                                }}
                                className="px-1.5 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded font-bold"
                              >
                                Sí
                              </button>
                              <button
                                onClick={() => setDeletingTag(null)}
                                className="px-1 py-0.5 text-neutral-400 hover:text-white"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => handleStartEdit(tag)}
                                className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors"
                                title="Editar nombre del tag"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingTag(tag)}
                                className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Eliminar tag"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-neutral-800 bg-neutral-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold transition-colors"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
