import React, { useMemo, useRef, useState } from 'react';
import {
  FileJson,
  FileSpreadsheet,
  Upload,
  ImageDown,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { PackagingItem } from '../types';
import { ProfileId, PROFILES } from '../firebase';
import {
  buildEnrichedRecords,
  exportDatabaseToJson,
  exportDatabaseToCsv,
} from '../utils/exportData';

interface DataDashboardViewProps {
  theme: 'dark' | 'light';
  activeProfile: ProfileId;
  items: PackagingItem[];
  categories: string[];
  tags: string[];
  onImportItems: (newItems: PackagingItem[]) => void;
}

export const DataDashboardView: React.FC<DataDashboardViewProps> = ({
  theme,
  activeProfile,
  items,
  categories,
  tags,
  onImportItems,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copiedUrls, setCopiedUrls] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isDownloadingThumbs, setIsDownloadingThumbs] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  const isLight = theme === 'light';
  const profileName = PROFILES[activeProfile].name;

  const kpis = useMemo(() => {
    const total = items.length;
    const favoritesCount = items.filter((i) => i.favorite).length;
    const withNotesCount = items.filter((i) => i.notes && i.notes.trim().length > 0).length;

    const categoryMap: Record<string, number> = {};
    categories.forEach((c) => {
      categoryMap[c] = 0;
    });
    const channelSet = new Set<string>();
    const tagMap: Record<string, number> = {};

    items.forEach((item) => {
      categoryMap[item.category] = (categoryMap[item.category] || 0) + 1;
      if (item.channelTitle && item.channelTitle.trim()) {
        channelSet.add(item.channelTitle.trim());
      }
      item.tags?.forEach((t) => {
        tagMap[t] = (tagMap[t] || 0) + 1;
      });
    });

    const topTags = Object.entries(tagMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    return {
      total,
      favoritesCount,
      withNotesCount,
      uniqueChannels: channelSet.size,
      categoryBreakdown: Object.entries(categoryMap).sort((a, b) => b[1] - a[1]),
      topTags,
    };
  }, [items, categories]);

  const enrichedItems = useMemo(() => buildEnrichedRecords(items), [items]);

  const handleCopyThumbnailUrls = async () => {
    const urlsText = enrichedItems.map((i) => i.thumbnailMaxResUrl).join('\n');
    try {
      await navigator.clipboard.writeText(urlsText);
      setCopiedUrls(true);
      setTimeout(() => setCopiedUrls(false), 2500);
    } catch {
      // ignore clipboard error
    }
  };

  const handleBulkDownloadThumbnails = async () => {
    if (enrichedItems.length === 0 || isDownloadingThumbs) return;
    setIsDownloadingThumbs(true);
    setDownloadProgress({ current: 0, total: enrichedItems.length });

    for (let i = 0; i < enrichedItems.length; i++) {
      const item = enrichedItems[i];
      setDownloadProgress({ current: i + 1, total: enrichedItems.length });
      try {
        let response = await fetch(item.thumbnailMaxResUrl);
        if (!response.ok) {
          response = await fetch(item.thumbnailHqUrl);
        }
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const safeCategory = (item.category || 'pack').replace(/[^a-z0-9-_]/gi, '_');
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `${safeCategory}_${item.videoId}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        await new Promise((r) => setTimeout(r, 220));
      } catch {
        // continue with next thumbnail if one fails
      }
    }

    setIsDownloadingThumbs(false);
    setDownloadProgress(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportStatus(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        let itemsToImport: PackagingItem[] = [];

        if (Array.isArray(parsed)) {
          itemsToImport = parsed;
        } else if (parsed && Array.isArray(parsed.items)) {
          itemsToImport = parsed.items;
        } else {
          setImportStatus({
            type: 'error',
            message: 'El archivo JSON no contiene una lista válida de packs.',
          });
          return;
        }

        const valid = itemsToImport.every((p) => p.videoId && p.title);
        if (valid) {
          onImportItems(itemsToImport);
          setImportStatus({
            type: 'success',
            message: `Se importaron ${itemsToImport.length} packs en el perfil de ${profileName}.`,
          });
        } else {
          setImportStatus({
            type: 'error',
            message: 'El archivo contiene registros sin videoId o título válido.',
          });
        }
      } catch {
        setImportStatus({
          type: 'error',
          message: 'No se pudo leer el archivo JSON.',
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b ${
          isLight ? 'border-neutral-200' : 'border-neutral-800/70'
        }`}
      >
        <div>
          <h1 className="text-lg font-bold tracking-tight">
            Datos y Exportación · {profileName}
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Métricas del repositorio, respaldo completo en JSON/CSV y descarga masiva de miniaturas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() =>
              exportDatabaseToJson(activeProfile, profileName, enrichedItems, categories, tags)
            }
            disabled={items.length === 0}
            className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>Exportar JSON</span>
          </button>

          <button
            onClick={() => exportDatabaseToCsv(activeProfile, enrichedItems)}
            disabled={items.length === 0}
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 ${
              isLight
                ? 'bg-white border-neutral-300 hover:bg-neutral-100 text-neutral-900'
                : 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-100'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className={`px-3.5 py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              isLight
                ? 'bg-white border-neutral-300 hover:bg-neutral-100 text-neutral-700'
                : 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-300'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importar JSON</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
            />
          </button>
        </div>
      </div>

      {importStatus && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            importStatus.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-red-950/40 border-red-500/40 text-red-300'
          }`}
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{importStatus.message}</span>
        </div>
      )}

      {/* KPI Summary Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className={`p-4 rounded-2xl border ${
            isLight
              ? 'bg-white border-neutral-200'
              : 'bg-neutral-900/50 border-neutral-800/80'
          }`}
        >
          <span className="text-xs text-neutral-500">Total de Packs</span>
          <div className="text-2xl font-bold tabular-nums mt-1">{kpis.total}</div>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            Almacenados en {profileName}
          </span>
        </div>

        <div
          className={`p-4 rounded-2xl border ${
            isLight
              ? 'bg-white border-neutral-200'
              : 'bg-neutral-900/50 border-neutral-800/80'
          }`}
        >
          <span className="text-xs text-neutral-500">Canales únicos</span>
          <div className="text-2xl font-bold tabular-nums mt-1">{kpis.uniqueChannels}</div>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            Referencias distintas
          </span>
        </div>

        <div
          className={`p-4 rounded-2xl border ${
            isLight
              ? 'bg-white border-neutral-200'
              : 'bg-neutral-900/50 border-neutral-800/80'
          }`}
        >
          <span className="text-xs text-neutral-500">Favoritos</span>
          <div className="text-2xl font-bold tabular-nums mt-1">{kpis.favoritesCount}</div>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            {kpis.total > 0
              ? `${Math.round((kpis.favoritesCount / kpis.total) * 100)}% del total`
              : '0% del total'}
          </span>
        </div>

        <div
          className={`p-4 rounded-2xl border ${
            isLight
              ? 'bg-white border-neutral-200'
              : 'bg-neutral-900/50 border-neutral-800/80'
          }`}
        >
          <span className="text-xs text-neutral-500">Packs con notas</span>
          <div className="text-2xl font-bold tabular-nums mt-1">{kpis.withNotesCount}</div>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            {tags.length} tags configurados
          </span>
        </div>
      </section>

      {/* Breakdown by Category + Bulk Thumbnail Actions */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          className={`p-5 rounded-2xl border space-y-4 ${
            isLight
              ? 'bg-white border-neutral-200'
              : 'bg-neutral-900/50 border-neutral-800/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Distribución por Categoría
            </h2>
            <span className="text-xs text-neutral-500 tabular-nums">
              {categories.length} categorías
            </span>
          </div>

          <div className="space-y-2.5">
            {kpis.categoryBreakdown.map(([cat, count]) => {
              const pct = kpis.total > 0 ? Math.round((count / kpis.total) * 100) : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{cat}</span>
                    <span className="text-neutral-500 tabular-nums">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div
                    className={`w-full h-1.5 rounded-full overflow-hidden ${
                      isLight ? 'bg-neutral-100' : 'bg-neutral-800'
                    }`}
                  >
                    <div
                      className="h-full bg-red-600 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {kpis.topTags.length > 0 && (
            <div
              className={`pt-4 border-t space-y-2 ${
                isLight ? 'border-neutral-200' : 'border-neutral-800/80'
              }`}
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block">
                Tags más usados
              </span>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                {kpis.topTags.map(([tag, count]) => (
                  <div key={tag} className="flex items-center gap-1.5">
                    <span className="text-neutral-400">#{tag}</span>
                    <span className="font-semibold tabular-nums">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
            isLight
              ? 'bg-white border-neutral-200'
              : 'bg-neutral-900/50 border-neutral-800/80'
          }`}
        >
          <div className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Descarga Masiva de Miniaturas y Datos Clave
            </h2>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Tanto el archivo <strong>JSON</strong> como el <strong>CSV</strong> incluyen las columnas clave (
              <code className="text-[11px]">videoId</code>, <code className="text-[11px]">title</code>,{' '}
              <code className="text-[11px]">channelTitle</code>, <code className="text-[11px]">category</code>,{' '}
              <code className="text-[11px]">tags</code>, <code className="text-[11px]">notes</code> y{' '}
              <code className="text-[11px]">thumbnailMaxResUrl</code>) listas para respaldos o gestores de descarga.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            <button
              onClick={handleBulkDownloadThumbnails}
              disabled={items.length === 0 || isDownloadingThumbs}
              className="px-3.5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {isDownloadingThumbs && downloadProgress ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="tabular-nums">
                    Descargando {downloadProgress.current}/{downloadProgress.total}...
                  </span>
                </>
              ) : (
                <>
                  <ImageDown className="w-4 h-4" />
                  <span>Descargar {items.length} miniaturas (.jpg)</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopyThumbnailUrls}
              disabled={items.length === 0}
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-40 ${
                isLight
                  ? 'bg-neutral-50 border-neutral-300 hover:bg-neutral-100 text-neutral-800'
                  : 'bg-neutral-950 border-neutral-800 hover:bg-neutral-800 text-neutral-200'
              }`}
            >
              {copiedUrls ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-500">¡URLs copiadas!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-neutral-400" />
                  <span>Copiar URLs de miniaturas HD</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Database Table Preview */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Registros en la Base de Datos ({enrichedItems.length})
          </h2>
        </div>

        {enrichedItems.length === 0 ? (
          <div
            className={`py-12 text-center border border-dashed rounded-2xl text-xs text-neutral-500 ${
              isLight ? 'border-neutral-300' : 'border-neutral-800'
            }`}
          >
            No hay registros cargados en este perfil.
          </div>
        ) : (
          <div
            className={`rounded-2xl border overflow-hidden ${
              isLight
                ? 'bg-white border-neutral-200'
                : 'bg-neutral-900/40 border-neutral-800/80'
            }`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr
                    className={`border-b text-[11px] font-semibold text-neutral-500 ${
                      isLight
                        ? 'border-neutral-200 bg-neutral-50'
                        : 'border-neutral-800 bg-neutral-900/80'
                    }`}
                  >
                    <th className="py-2.5 px-3">Miniatura</th>
                    <th className="py-2.5 px-3">Video ID</th>
                    <th className="py-2.5 px-3">Título</th>
                    <th className="py-2.5 px-3">Canal</th>
                    <th className="py-2.5 px-3">Categoría</th>
                    <th className="py-2.5 px-3">Tags</th>
                    <th className="py-2.5 px-3 text-right">Links</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${
                    isLight ? 'divide-neutral-200' : 'divide-neutral-800/60'
                  }`}
                >
                  {enrichedItems.map((item) => (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isLight ? 'hover:bg-neutral-50' : 'hover:bg-neutral-900/60'
                      }`}
                    >
                      <td className="py-2 px-3 w-20">
                        <img
                          src={item.thumbnailHqUrl}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-16 aspect-video object-cover rounded bg-neutral-800"
                        />
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px] text-neutral-400 tabular-nums whitespace-nowrap">
                        {item.videoId}
                      </td>
                      <td className="py-2 px-3 max-w-xs">
                        <div className="font-medium truncate" title={item.title}>
                          {item.title}
                        </div>
                        {item.notes && (
                          <div className="text-[11px] text-neutral-500 truncate italic">
                            "{item.notes}"
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3 text-neutral-400 whitespace-nowrap max-w-[160px] truncate">
                        {item.channelTitle || '—'}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className="font-medium text-red-500">{item.category}</span>
                      </td>
                      <td className="py-2 px-3 text-neutral-400 max-w-[180px] truncate">
                        {item.tags.length > 0 ? item.tags.map((t) => `#${t}`).join(' ') : '—'}
                      </td>
                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <a
                            href={item.thumbnailMaxResUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-neutral-400 hover:text-red-500 transition-colors"
                            title="Abrir miniatura HD"
                          >
                            JPG
                          </a>
                          <span className="text-neutral-700">·</span>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-neutral-400 hover:text-red-500 inline-flex items-center gap-0.5 transition-colors"
                            title="Abrir video en YouTube"
                          >
                            <span>YT</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
