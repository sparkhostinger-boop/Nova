import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { 
  Search, 
  Download, 
  RefreshCw, 
  Puzzle, 
  AlertCircle, 
  Box, 
  Server, 
  Cpu, 
  ExternalLink, 
  List, 
  Check, 
  X, 
  Trash2, 
  Loader2, 
  ChevronDown, 
  Sparkles, 
  FolderCheck,
  Layers,
  ArrowDownToLine
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingOverlay } from "./LoadingOverlay";

interface Plugin {
  id: string;
  slug?: string;
  source: 'modrinth' | 'spigot' | 'hangar';
  name: string;
  tag: string;
  downloads: number;
  rating?: number;
  icon: string | null;
  author?: string;
  url?: string;
}

interface PluginVersion {
  id: string;
  name: string;
  versionNumber: string;
  versionType: 'release' | 'beta' | 'alpha';
  gameVersions: string[];
  loaders: string[];
  datePublished?: string;
  downloads?: number;
  files: {
    url: string;
    filename: string;
    size: number;
    primary?: boolean;
  }[];
}

interface InstalledPluginFile {
  filename: string;
  size: number;
  updatedAt: string;
}

export default function PluginManager({ serverId }: { serverId: string }) {
  // Filter States - exactly matching screenshot
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedVersion, setSelectedVersion] = useState("Any");
  const [selectedLoader, setSelectedLoader] = useState("PaperMC");
  const [selectedSort, setSelectedSort] = useState("Downloads");
  const [selectedProvider, setSelectedProvider] = useState("Modrinth");
  const [selectedSize, setSelectedSize] = useState("48");

  // Data States
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [installedPlugins, setInstalledPlugins] = useState<InstalledPluginFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [installSuccessMessage, setInstallSuccessMessage] = useState<string | null>(null);
  const [installErrorMessage, setInstallErrorMessage] = useState<string | null>(null);

  // Expanded descriptions state (for "Read more" toggle)
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // Versions Modal States
  const [selectedPluginForVersions, setSelectedPluginForVersions] = useState<Plugin | null>(null);
  const [versionsList, setVersionsList] = useState<PluginVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [installingVersionFile, setInstallingVersionFile] = useState<string | null>(null);

  // Installed Modal / Drawer
  const [showInstalledModal, setShowInstalledModal] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 450);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load installed plugins list
  const loadInstalledPlugins = async () => {
    try {
      const res = await axios.get(`/api/servers/${serverId}/plugins/installed`);
      if (res.data?.plugins) {
        setInstalledPlugins(res.data.plugins);
      }
    } catch (e) {
      console.warn("Could not load installed plugins list:", e);
    }
  };

  useEffect(() => {
    loadInstalledPlugins();
  }, [serverId]);

  // Search plugins based on current filters
  const fetchPlugins = async () => {
    setLoading(true);
    setInstallErrorMessage(null);
    try {
      const results: Plugin[] = [];
      const externalAxios = axios.create();
      delete externalAxios.defaults.headers.common["Authorization"];

      const query = debouncedQuery.trim();
      const limit = parseInt(selectedSize, 10) || 48;

      // 1. Modrinth Provider
      if (selectedProvider === "Modrinth" || selectedProvider === "All Providers") {
        try {
          const facets: string[][] = [["project_type:plugin"]];

          // Server loader mapping for Modrinth
          if (selectedLoader && selectedLoader !== "Any") {
            const loaderMap: Record<string, string> = {
              "PaperMC": "paper",
              "Purpur": "purpur",
              "Spigot": "spigot",
              "Bukkit": "bukkit",
              "Velocity": "velocity",
              "BungeeCord": "bungeecord",
              "Fabric": "fabric",
              "Forge": "forge"
            };
            const loaderFacet = loaderMap[selectedLoader] || selectedLoader.toLowerCase();
            facets.push([`categories:${loaderFacet}`]);
          }

          // Version facet for Modrinth
          if (selectedVersion && selectedVersion !== "Any") {
            facets.push([`versions:${selectedVersion}`]);
          }

          // Sort index mapping for Modrinth
          const sortMap: Record<string, string> = {
            "Downloads": "downloads",
            "Relevance": "relevance",
            "Updated": "updated",
            "Newest": "newest"
          };
          const index = sortMap[selectedSort] || "downloads";

          const modrinthUrl = `https://api.modrinth.com/v2/search?query=${encodeURIComponent(query)}&facets=${encodeURIComponent(JSON.stringify(facets))}&index=${index}&limit=${limit}`;
          const res = await externalAxios.get(modrinthUrl);

          if (res.data?.hits) {
            res.data.hits.forEach((hit: any) => {
              results.push({
                id: hit.project_id,
                slug: hit.slug,
                source: "modrinth",
                name: hit.title,
                tag: hit.description || "",
                downloads: hit.downloads || 0,
                rating: hit.follows || 0,
                icon: hit.icon_url || null,
                author: hit.author,
                url: `https://modrinth.com/plugin/${hit.slug || hit.project_id}`
              });
            });
          }
        } catch (err) {
          console.error("Modrinth fetch error:", err);
        }
      }

      // 2. Spigot Provider
      if (selectedProvider === "SpigotMC" || selectedProvider === "All Providers") {
        try {
          let spigotUrl = "";
          if (query) {
            spigotUrl = `https://api.spiget.org/v2/search/resources/${encodeURIComponent(query)}?field=name&size=${limit}&page=1`;
          } else {
            spigotUrl = `https://api.spiget.org/v2/resources/free?size=${limit}&sort=${selectedSort === "Downloads" ? "-downloads" : "-update"}`;
          }

          const res = await externalAxios.get(spigotUrl);
          if (Array.isArray(res.data)) {
            res.data.forEach((hit: any) => {
              results.push({
                id: hit.id.toString(),
                source: "spigot",
                name: hit.name,
                tag: hit.tag || "",
                downloads: hit.downloads || 0,
                rating: hit.rating?.average || 0,
                icon: hit.icon?.url ? `https://spigotmc.org/${hit.icon.url}` : null,
                url: `https://www.spigotmc.org/resources/${hit.id}`
              });
            });
          }
        } catch (err) {
          console.error("Spigot fetch error:", err);
        }
      }

      // 3. Hangar (Paper) Provider
      if (selectedProvider === "Hangar (Paper)" || selectedProvider === "All Providers") {
        try {
          const hangarUrl = `https://hangar.papermc.io/api/v1/projects?q=${encodeURIComponent(query)}&limit=${limit}`;
          const res = await externalAxios.get(hangarUrl);
          if (res.data?.result) {
            res.data.result.forEach((hit: any) => {
              const fullSlug = `${hit.namespace.owner}/${hit.namespace.slug}`;
              results.push({
                id: fullSlug,
                slug: hit.namespace.slug,
                source: "hangar",
                name: hit.name,
                tag: hit.description || "",
                downloads: hit.stats?.downloads || 0,
                rating: hit.stats?.stars || 0,
                icon: hit.avatarUrl || null,
                author: hit.namespace.owner,
                url: `https://hangar.papermc.io/${fullSlug}`
              });
            });
          }
        } catch (err) {
          console.error("Hangar fetch error:", err);
        }
      }

      // Secondary client-side sort if multiple providers combined
      if (selectedProvider === "All Providers") {
        if (selectedSort === "Downloads") {
          results.sort((a, b) => b.downloads - a.downloads);
        }
      }

      setPlugins(results);
    } catch (e: any) {
      console.error("Plugin search failure:", e);
      setInstallErrorMessage("Failed to load plugins. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  // Re-trigger search whenever any filter changes
  useEffect(() => {
    fetchPlugins();
  }, [debouncedQuery, selectedVersion, selectedLoader, selectedSort, selectedProvider, selectedSize]);

  // Check if a plugin is installed by comparing filename / slug
  const isPluginInstalled = (plugin: Plugin) => {
    const cleanName = plugin.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const cleanSlug = (plugin.slug || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    return installedPlugins.some(f => {
      const fn = f.filename.toLowerCase().replace(/[^a-z0-9]/g, "");
      return fn.includes(cleanName) || (cleanSlug && fn.includes(cleanSlug));
    });
  };

  // Install latest primary version
  const handleInstallLatest = async (plugin: Plugin) => {
    try {
      setInstallingId(plugin.id);
      setInstallSuccessMessage(null);
      setInstallErrorMessage(null);

      const res = await axios.post(`/api/servers/${serverId}/plugins/install`, {
        source: plugin.source,
        pluginId: plugin.slug || plugin.id,
        pluginName: plugin.name
      });

      if (res.data?.success) {
        setInstallSuccessMessage(`"${plugin.name}" was successfully installed! Restart your server to load it.`);
        await loadInstalledPlugins();
        setTimeout(() => setInstallSuccessMessage(null), 6000);
      }
    } catch (err: any) {
      setInstallErrorMessage(err.response?.data?.error || `Failed to install "${plugin.name}".`);
    } finally {
      setInstallingId(null);
    }
  };

  // Open Versions Modal & fetch available versions
  const handleOpenVersions = async (plugin: Plugin) => {
    setSelectedPluginForVersions(plugin);
    setVersionsList([]);
    setLoadingVersions(true);

    try {
      const externalAxios = axios.create();
      delete externalAxios.defaults.headers.common["Authorization"];

      if (plugin.source === "modrinth") {
        const idOrSlug = plugin.slug || plugin.id;
        const res = await externalAxios.get(`https://api.modrinth.com/v2/project/${idOrSlug}/version`);
        if (Array.isArray(res.data)) {
          const mapped: PluginVersion[] = res.data.map((v: any) => ({
            id: v.id,
            name: v.name,
            versionNumber: v.version_number,
            versionType: v.version_type || "release",
            gameVersions: v.game_versions || [],
            loaders: v.loaders || [],
            datePublished: v.date_published,
            downloads: v.downloads,
            files: (v.files || []).map((f: any) => ({
              url: f.url,
              filename: f.filename,
              size: f.size,
              primary: f.primary
            }))
          }));
          setVersionsList(mapped);
        }
      } else if (plugin.source === "hangar") {
        const [owner, slug] = plugin.id.split("/");
        const res = await externalAxios.get(`https://hangar.papermc.io/api/v1/projects/${owner}/${slug}/versions`);
        if (res.data?.result) {
          const mapped: PluginVersion[] = res.data.result.map((v: any) => {
            const paperDownload = v.downloads?.PAPER || Object.values(v.downloads || {})[0];
            return {
              id: v.name,
              name: v.name,
              versionNumber: v.name,
              versionType: (v.channel?.name || "release").toLowerCase() as any,
              gameVersions: v.platformDependencies?.PAPER || [],
              loaders: ["Paper"],
              datePublished: v.createdAt,
              downloads: v.stats?.downloads || 0,
              files: paperDownload?.downloadUrl ? [{
                url: paperDownload.downloadUrl,
                filename: paperDownload.fileInfo?.name || `${plugin.name}-${v.name}.jar`,
                size: paperDownload.fileInfo?.sizeBytes || 0,
                primary: true
              }] : []
            };
          });
          setVersionsList(mapped);
        }
      } else {
        // Fallback for Spigot (single generic version)
        setVersionsList([
          {
            id: plugin.id,
            name: `${plugin.name} Latest`,
            versionNumber: "Latest",
            versionType: "release",
            gameVersions: ["1.8 - 1.21+"],
            loaders: ["Spigot", "Paper"],
            files: [
              {
                url: `https://api.spiget.org/v2/resources/${plugin.id}/download`,
                filename: `${plugin.name.replace(/[^a-zA-Z0-9]/g, '_')}.jar`,
                size: 0,
                primary: true
              }
            ]
          }
        ]);
      }
    } catch (e) {
      console.error("Failed to load versions:", e);
    } finally {
      setLoadingVersions(false);
    }
  };

  // Install a specific version file from the versions modal
  const handleInstallSpecificVersion = async (plugin: Plugin, file: { url: string; filename: string }) => {
    try {
      setInstallingVersionFile(file.filename);
      setInstallErrorMessage(null);
      setInstallSuccessMessage(null);

      const res = await axios.post(`/api/servers/${serverId}/plugins/install`, {
        downloadUrl: file.url,
        filename: file.filename,
        pluginName: plugin.name
      });

      if (res.data?.success) {
        setInstallSuccessMessage(`Installed version file: ${file.filename}`);
        await loadInstalledPlugins();
        setTimeout(() => setInstallSuccessMessage(null), 6000);
      }
    } catch (err: any) {
      setInstallErrorMessage(err.response?.data?.error || "Failed to install selected version.");
    } finally {
      setInstallingVersionFile(null);
    }
  };

  // Delete installed plugin
  const handleDeleteInstalledPlugin = async (filename: string) => {
    if (!confirm(`Are you sure you want to remove "${filename}" from your server?`)) return;
    try {
      await axios.delete(`/api/servers/${serverId}/plugins/installed/${encodeURIComponent(filename)}`);
      await loadInstalledPlugins();
      setInstallSuccessMessage(`Removed "${filename}". Please restart the server.`);
      setTimeout(() => setInstallSuccessMessage(null), 5000);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to remove plugin.");
    }
  };

  // Toggle card description expand
  const toggleCardExpand = (id: string) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Format file size
  const formatSize = (bytes: number) => {
    if (!bytes || bytes <= 0) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex-1 w-full min-h-screen text-foreground bg-[#141820] custom-scrollbar overflow-y-auto pb-12">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── TOP FILTER BAR · EXACT MATCH TO SCREENSHOT ────────────────── */}
        <div className="w-full bg-[#1b222d] border border-zinc-800/80 rounded-2xl p-4 sm:p-5 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3.5 items-end">
            
            {/* 1. Search (takes major horizontal space) */}
            <div className="sm:col-span-2 md:col-span-4 lg:col-span-4 flex flex-col gap-1.5">
              <label htmlFor="plugin-search-input" className="text-xs font-semibold text-zinc-400">
                Search
              </label>
              <div className="relative">
                <input
                  id="plugin-search-input"
                  type="text"
                  placeholder="Search plugins..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#242b36] border border-zinc-700/60 rounded-xl px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* 2. Versions Dropdown */}
            <div className="sm:col-span-1 md:col-span-2 lg:col-span-1.5 flex flex-col gap-1.5">
              <label htmlFor="plugin-version-select" className="text-xs font-semibold text-zinc-400">
                Versions
              </label>
              <div className="relative">
                <select
                  id="plugin-version-select"
                  value={selectedVersion}
                  onChange={(e) => setSelectedVersion(e.target.value)}
                  className="w-full appearance-none bg-[#242b36] border border-zinc-700/60 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 cursor-pointer pr-8"
                >
                  <option value="Any">Any</option>
                  <option value="1.21.4">1.21.4</option>
                  <option value="1.21.1">1.21.1</option>
                  <option value="1.21">1.21</option>
                  <option value="1.20.6">1.20.6</option>
                  <option value="1.20.4">1.20.4</option>
                  <option value="1.20.2">1.20.2</option>
                  <option value="1.20.1">1.20.1</option>
                  <option value="1.19.4">1.19.4</option>
                  <option value="1.19.2">1.19.2</option>
                  <option value="1.18.2">1.18.2</option>
                  <option value="1.16.5">1.16.5</option>
                  <option value="1.12.2">1.12.2</option>
                  <option value="1.8.8">1.8.8</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            {/* 3. Server Loaders Dropdown */}
            <div className="sm:col-span-1 md:col-span-2 lg:col-span-2 flex flex-col gap-1.5">
              <label htmlFor="plugin-loader-select" className="text-xs font-semibold text-zinc-400">
                Server Loaders
              </label>
              <div className="relative">
                <select
                  id="plugin-loader-select"
                  value={selectedLoader}
                  onChange={(e) => setSelectedLoader(e.target.value)}
                  className="w-full appearance-none bg-[#242b36] border border-zinc-700/60 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 cursor-pointer pr-8"
                >
                  <option value="PaperMC">PaperMC</option>
                  <option value="Purpur">Purpur</option>
                  <option value="Spigot">Spigot</option>
                  <option value="Bukkit">Bukkit</option>
                  <option value="Velocity">Velocity</option>
                  <option value="BungeeCord">BungeeCord</option>
                  <option value="Fabric">Fabric</option>
                  <option value="Forge">Forge</option>
                  <option value="Any">Any</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            {/* 4. Sort By Dropdown */}
            <div className="sm:col-span-1 md:col-span-2 lg:col-span-1.5 flex flex-col gap-1.5">
              <label htmlFor="plugin-sort-select" className="text-xs font-semibold text-zinc-400">
                Sort By
              </label>
              <div className="relative">
                <select
                  id="plugin-sort-select"
                  value={selectedSort}
                  onChange={(e) => setSelectedSort(e.target.value)}
                  className="w-full appearance-none bg-[#242b36] border border-zinc-700/60 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 cursor-pointer pr-8"
                >
                  <option value="Downloads">Downloads</option>
                  <option value="Relevance">Relevance</option>
                  <option value="Updated">Updated</option>
                  <option value="Newest">Newest</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            {/* 5. Providers Dropdown */}
            <div className="sm:col-span-1 md:col-span-2 lg:col-span-1.5 flex flex-col gap-1.5">
              <label htmlFor="plugin-provider-select" className="text-xs font-semibold text-zinc-400">
                Providers
              </label>
              <div className="relative">
                <select
                  id="plugin-provider-select"
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="w-full appearance-none bg-[#242b36] border border-zinc-700/60 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 cursor-pointer pr-8"
                >
                  <option value="Modrinth">Modrinth</option>
                  <option value="SpigotMC">SpigotMC</option>
                  <option value="Hangar (Paper)">Hangar</option>
                  <option value="All Providers">All Providers</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            {/* 6. Size Dropdown */}
            <div className="sm:col-span-1 md:col-span-2 lg:col-span-1.5 flex flex-col gap-1.5">
              <label htmlFor="plugin-size-select" className="text-xs font-semibold text-zinc-400">
                Size
              </label>
              <div className="relative">
                <select
                  id="plugin-size-select"
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="w-full appearance-none bg-[#242b36] border border-zinc-700/60 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 cursor-pointer pr-8"
                >
                  <option value="12">12</option>
                  <option value="24">24</option>
                  <option value="48">48</option>
                  <option value="96">96</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
            </div>

          </div>

          {/* Sub-bar: Status and Installed Plugins Drawer Link */}
          <div className="mt-4 pt-3 border-t border-zinc-800/60 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
              <span>
                Showing <strong>{plugins.length}</strong> plugins for {selectedLoader} on {selectedProvider}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="plugin-view-installed-btn"
                onClick={() => setShowInstalledModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252c38] hover:bg-[#303949] text-zinc-200 hover:text-white transition-colors border border-zinc-700/50 cursor-pointer"
              >
                <FolderCheck size={14} className="text-indigo-400" />
                <span>Installed Plugins</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-[10px]">
                  {installedPlugins.length}
                </span>
              </button>

              <button
                onClick={fetchPlugins}
                disabled={loading}
                title="Refresh listings"
                className="p-1.5 rounded-lg bg-[#252c38] hover:bg-[#303949] text-zinc-300 hover:text-white transition-colors border border-zinc-700/50 cursor-pointer"
              >
                <RefreshCw size={14} className={loading ? "animate-spin text-blue-400" : ""} />
              </button>
            </div>
          </div>
        </div>

        {/* ── ALERTS / NOTICES ─────────────────────────────────────────── */}
        {installSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm"
          >
            <div className="flex items-center gap-2.5">
              <Check size={18} className="text-emerald-400 shrink-0" />
              <span>{installSuccessMessage}</span>
            </div>
            <button onClick={() => setInstallSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-200">
              <X size={16} />
            </button>
          </motion.div>
        )}

        {installErrorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle size={18} className="text-red-400 shrink-0" />
              <span>{installErrorMessage}</span>
            </div>
            <button onClick={() => setInstallErrorMessage(null)} className="text-red-400 hover:text-red-200">
              <X size={16} />
            </button>
          </motion.div>
        )}

        {/* ── PLUGINS GRID · 3 COLUMNS MATCHING SCREENSHOT ─────────────── */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-9 h-9 animate-spin text-blue-500 mb-3" />
            <p className="text-sm font-medium text-zinc-300">Searching repositories...</p>
            <p className="text-xs text-zinc-500 mt-1">Fetching {selectedProvider} results for {selectedLoader}</p>
          </div>
        ) : plugins.length === 0 ? (
          <div className="py-24 bg-[#1b222d]/60 border border-zinc-800/80 rounded-2xl flex flex-col items-center justify-center text-center p-8">
            <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 flex items-center justify-center text-zinc-500 mb-3">
              <Puzzle size={28} />
            </div>
            <h4 className="text-base font-semibold text-zinc-200">No plugins found</h4>
            <p className="text-xs text-zinc-400 max-w-md mt-1 mb-4">
              Try adjusting your search query, switching server loaders (e.g. to "PaperMC" or "Any"), or selecting "All Providers".
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedLoader("PaperMC");
                setSelectedProvider("Modrinth");
                setSelectedVersion("Any");
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-4.5">
            {plugins.map((plugin) => {
              const isInstalled = isPluginInstalled(plugin);
              const isCurrentlyInstalling = installingId === plugin.id;
              const isExpanded = !!expandedCards[plugin.id];
              const isLongTag = (plugin.tag || "").length > 85;

              return (
                <div
                  key={`${plugin.source}-${plugin.id}`}
                  className="bg-[#1e2532] hover:bg-[#222a39] border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-4.5 flex flex-col justify-between transition-all duration-200 shadow-lg shadow-black/20 group relative overflow-hidden"
                >
                  {/* Top: Icon + Title + Downloads */}
                  <div>
                    <div className="flex items-start gap-3.5">
                      {/* Plugin Icon */}
                      <div className="w-12 h-12 rounded-xl bg-[#283141] border border-zinc-700/40 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                        {plugin.icon ? (
                          <img
                            src={plugin.icon}
                            alt={plugin.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // If image fails, fallback gracefully
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <Puzzle size={22} className="text-zinc-400 group-hover:text-blue-400 transition-colors" />
                        )}
                      </div>

                      {/* Title & Downloads */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h3
                            className="text-[15px] font-bold text-white tracking-tight truncate leading-tight group-hover:text-blue-400 transition-colors"
                            title={plugin.name}
                          >
                            {plugin.name}
                          </h3>
                        </div>

                        {/* Downloads count matching image format (e.g. 26,655,745 with tray icon) */}
                        <div className="flex items-center gap-1 mt-1 text-xs text-zinc-400 font-medium">
                          <ArrowDownToLine size={13} className="text-zinc-400 shrink-0" />
                          <span>{plugin.downloads.toLocaleString()}</span>

                          {isInstalled && (
                            <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 font-semibold text-[10px] border border-emerald-500/25">
                              <Check size={11} /> Installed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Description with "Read more" toggle */}
                    <div className="mt-3 text-xs text-zinc-400 leading-relaxed min-h-[36px]">
                      <p className={isExpanded ? "" : "line-clamp-2"}>
                        {plugin.tag || "No description provided."}
                      </p>
                      {isLongTag && (
                        <button
                          type="button"
                          onClick={() => toggleCardExpand(plugin.id)}
                          className="text-zinc-400 hover:text-zinc-200 text-xs underline mt-0.5 cursor-pointer block"
                        >
                          {isExpanded ? "Read less" : "Read more"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action Row: External link button + Versions + Install button */}
                  <div className="mt-4 pt-3.5 border-t border-zinc-800/60 flex items-center justify-between gap-2">
                    {/* Left: External Link square button */}
                    <a
                      href={plugin.url || `https://modrinth.com/plugin/${plugin.slug || plugin.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-xl bg-[#2c3545] hover:bg-[#384357] text-zinc-300 hover:text-white flex items-center justify-center transition-colors shadow-sm shrink-0"
                      title="View on official website"
                    >
                      <ExternalLink size={15} />
                    </a>

                    {/* Right: Versions and Install buttons */}
                    <div className="flex items-center gap-2">
                      {/* Versions button */}
                      <button
                        id={`plugin-versions-btn-${plugin.id}`}
                        onClick={() => handleOpenVersions(plugin)}
                        className="bg-[#2c3545] hover:bg-[#384357] text-zinc-200 hover:text-white text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                        title="Browse available versions"
                      >
                        <List size={14} />
                        <span>Versions</span>
                      </button>

                      {/* Install button */}
                      <button
                        id={`plugin-install-btn-${plugin.id}`}
                        onClick={() => handleInstallLatest(plugin)}
                        disabled={isCurrentlyInstalling}
                        className={`text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-98 cursor-pointer ${
                          isInstalled
                            ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60"
                            : "bg-[#1d6fe9] hover:bg-[#1860cb] text-white shadow-blue-600/20"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={isInstalled ? "Reinstall plugin" : "Install plugin"}
                      >
                        {isCurrentlyInstalling ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Installing…</span>
                          </>
                        ) : isInstalled ? (
                          <>
                            <Check size={14} className="text-emerald-400" />
                            <span>Reinstall</span>
                          </>
                        ) : (
                          <>
                            <Download size={14} />
                            <span>Install</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ── VERSIONS MODAL ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedPluginForVersions && (
          <div
            id="versions-modal-backdrop"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedPluginForVersions(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-2xl bg-[#1b222d] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-8 text-foreground"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#161c26]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#252c38] border border-zinc-700/50 flex items-center justify-center overflow-hidden shrink-0">
                    {selectedPluginForVersions.icon ? (
                      <img
                        src={selectedPluginForVersions.icon}
                        alt={selectedPluginForVersions.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Puzzle size={20} className="text-blue-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      {selectedPluginForVersions.name}
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {selectedPluginForVersions.source}
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Select a specific version to download and install
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPluginForVersions(null)}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Versions List */}
              <div className="p-6 max-h-[65vh] overflow-y-auto custom-scrollbar space-y-3">
                {loadingVersions ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                    <p className="text-xs text-zinc-400">Loading version manifests…</p>
                  </div>
                ) : versionsList.length === 0 ? (
                  <div className="py-12 text-center text-zinc-400 text-xs">
                    No version history available for this plugin. You can still install the latest version directly.
                  </div>
                ) : (
                  versionsList.map((ver) => {
                    const primaryFile = ver.files.find(f => f.primary) || ver.files[0];
                    const isInstallingThis = installingVersionFile === primaryFile?.filename;

                    return (
                      <div
                        key={ver.id || ver.versionNumber}
                        className="p-3.5 bg-[#212836] border border-zinc-800 hover:border-zinc-700 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm text-white">
                              {ver.name || ver.versionNumber}
                            </span>

                            {/* Release type badge */}
                            <span
                              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                                ver.versionType === "release"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : ver.versionType === "beta"
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                  : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              }`}
                            >
                              {ver.versionType}
                            </span>

                            {primaryFile?.size ? (
                              <span className="text-[11px] text-zinc-400">
                                {formatSize(primaryFile.size)}
                              </span>
                            ) : null}
                          </div>

                          {/* Supported Minecraft versions & loaders pills */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {ver.gameVersions.slice(0, 4).map((gv) => (
                              <span
                                key={gv}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono"
                              >
                                MC {gv}
                              </span>
                            ))}
                            {ver.gameVersions.length > 4 && (
                              <span className="text-[10px] text-zinc-500">
                                +{ver.gameVersions.length - 4} more
                              </span>
                            )}

                            {ver.loaders.map((l) => (
                              <span
                                key={l}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 font-medium"
                              >
                                {l}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Action Button */}
                        {primaryFile ? (
                          <button
                            onClick={() => handleInstallSpecificVersion(selectedPluginForVersions, primaryFile)}
                            disabled={isInstallingThis}
                            className="w-full sm:w-auto px-4 py-2 bg-[#1d6fe9] hover:bg-[#1860cb] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                          >
                            {isInstallingThis ? (
                              <>
                                <Loader2 size={13} className="animate-spin" />
                                <span>Installing…</span>
                              </>
                            ) : (
                              <>
                                <Download size={13} />
                                <span>Install</span>
                              </>
                            )}
                          </button>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── INSTALLED PLUGINS MODAL ─────────────────────────────────────── */}
      <AnimatePresence>
        {showInstalledModal && (
          <div
            id="installed-modal-backdrop"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowInstalledModal(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-xl bg-[#1b222d] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-8 text-foreground"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#161c26]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <FolderCheck size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Installed Plugins</h3>
                    <p className="text-xs text-zinc-400">
                      Located in <code className="text-zinc-300 font-mono text-[11px]">plugins/</code> directory
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowInstalledModal(false)}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-2.5">
                {installedPlugins.length === 0 ? (
                  <div className="py-12 text-center text-zinc-400 text-xs">
                    <Puzzle size={28} className="mx-auto text-zinc-600 mb-2" />
                    No plugins installed yet. Search and click "Install" on any plugin above.
                  </div>
                ) : (
                  installedPlugins.map((f) => (
                    <div
                      key={f.filename}
                      className="p-3 bg-[#212836] border border-zinc-800/80 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex items-center gap-2.5">
                        <Puzzle size={16} className="text-indigo-400 shrink-0" />
                        <div className="truncate">
                          <p className="font-semibold text-sm text-zinc-200 truncate">{f.filename}</p>
                          <p className="text-[11px] text-zinc-500">
                            {formatSize(f.size)} • Last modified {new Date(f.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteInstalledPlugin(f.filename)}
                        className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Delete this plugin"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="px-6 py-3 bg-[#161c26] border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                <span>Total: {installedPlugins.length} plugins installed</span>
                <span className="text-[11px] text-amber-400">⚠️ Restart server to apply changes</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Installing Overlay */}
      {installingId && <LoadingOverlay message="Downloading and installing plugin..." />}
    </div>
  );
}
