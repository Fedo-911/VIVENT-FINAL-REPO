import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FaBolt,
  FaCalendarAlt,
  FaChartLine,
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaDownload,
  FaEye,
  FaFacebook,
  FaFilter,
  FaHashtag,
  FaInstagram,
  FaLinkedin,
  FaPause,
  FaPlay,
  FaRegClock,
  FaRegCopy,
  FaRegImage,
  FaRegTrashAlt,
  FaSearch,
  FaSyncAlt,
  FaTimes,
  FaUpload,
  FaUserCircle,
} from "react-icons/fa";
import { FaPinterestP, FaTiktok, FaXTwitter } from "react-icons/fa6";
import { adminPostManagementApi, campaignsApi } from "../utils/api";

const platformIcons = {
  instagram: FaInstagram,
  facebook: FaFacebook,
  linkedin: FaLinkedin,
  tiktok: FaTiktok
  
};

const columns = [
  ["user_id", "User ID", 150],
  ["profile_photo", "Photo", 80],
  ["full_name", "Full Name", 180],
  ["business_name", "Business Name", 190],
  ["organization", "Organization", 170],
  ["email", "Email", 230],
  ["phone", "Phone", 140],
  ["purchased_plan", "Purchased Plan", 150],
  ["campaign_status", "Campaign Status", 150],
  ["connected_platforms", "Platforms", 160],
  ["remaining_posts", "Posts", 110],
  ["remaining_days", "Days", 110],
  ["assigned_ai_agent", "AI Agent", 150],
  ["last_ai_run", "Last AI Run", 170],
  ["created_date", "Created Date", 160],
  ["actions", "Actions", 250],
];

const filters = [
  ["all", "All"],
  ["basic_plan", "Basic Plan"],
  ["standard_plan", "Standard Plan"],
  ["premium_plan", "Premium Plan"],
  ["active", "Campaign Active"],
  ["paused", "Campaign Paused"],
  ["expired", "Expired"],
  ["connected_accounts", "Connected Accounts"],
  ["disconnected_accounts", "Disconnected Accounts"],
  ["manual_approval", "Manual Approval"],
  ["auto_publish", "Auto Publish"],
  ["failed_posts", "Failed Posts"],
  ["scheduled_posts", "Scheduled Posts"],
];

const statusClasses = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  paused: "bg-amber-50 text-amber-700 ring-amber-200",
  expired: "bg-rose-50 text-rose-700 ring-rose-200",
  completed: "bg-blue-50 text-blue-800 ring-blue-200",
  pending: "bg-slate-100 text-slate-700 ring-slate-200",
  cancelled: "bg-red-50 text-red-700 ring-red-200",
  failed: "bg-red-50 text-red-700 ring-red-200",
  scheduled: "bg-cyan-50 text-cyan-700 ring-cyan-200",
};

const label = (value) =>
  String(value || "Not provided")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatDate = (value) => {
  if (!value) return "Not available";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Not available" : parsed.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
};

const shortId = (value) => String(value || "").slice(0, 8) || "Unknown";

const useDebouncedValue = (value, delay = 350) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

const cache = new Map();

export default function CampaignManager() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState({ key: "created_at", dir: "desc" });
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState([]);
  const [drawerUserId, setDrawerUserId] = useState("");
  const [drawerData, setDrawerData] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [columnWidths, setColumnWidths] = useState(() => Object.fromEntries(columns.map(([key, , width]) => [key, width])));
  const debouncedQuery = useDebouncedValue(query);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const allVisibleSelected = rows.length > 0 && rows.every((row) => selected.includes(row.user_id));

  const loadUsers = useCallback(async ({ force = false } = {}) => {
    setLoading(true);
    setMessage("");
    const params = { page, page_size: pageSize, q: debouncedQuery, filter, sort_by: sort.key, sort_dir: sort.dir };
    const cacheKey = JSON.stringify(params);
    try {
      const data = force || !cache.has(cacheKey) ? await adminPostManagementApi.users(params) : cache.get(cacheKey);
      cache.set(cacheKey, data);
      setRows(data.items || []);
      setTotal(data.total || 0);
    } catch (error) {
      setRows([]);
      setTotal(0);
      setMessage(error.message || "Could not load campaign users.");
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, filter, page, pageSize, sort]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, filter, pageSize]);

  const loadDrawer = async (userId) => {
    setDrawerUserId(userId);
    setDrawerLoading(true);
    setDrawerData(null);
    try {
      setDrawerData(await adminPostManagementApi.user(userId));
    } catch (error) {
      setMessage(error.message || "Could not load campaign profile.");
    } finally {
      setDrawerLoading(false);
    }
  };

  const refresh = () => {
    cache.clear();
    loadUsers({ force: true });
    if (drawerUserId) loadDrawer(drawerUserId);
  };

  const runAction = async (userId, action, success) => {
    setMessage("");
    try {
      await action(userId);
      setMessage(success);
      cache.clear();
      await loadUsers({ force: true });
      if (drawerUserId === userId) await loadDrawer(userId);
    } catch (error) {
      setMessage(error.message || "Action failed.");
    }
  };

  const runBulk = async (actionName) => {
    const actions = {
      run: adminPostManagementApi.runAi,
      pause: adminPostManagementApi.pause,
      resume: adminPostManagementApi.resume,
      publish: adminPostManagementApi.publishApproved,
      delete: adminPostManagementApi.deleteCampaign,
    };
    if (!selected.length || !actions[actionName]) return;
    if (actionName === "delete" && !window.confirm(`Delete ${selected.length} selected campaigns?`)) return;
    await Promise.all(selected.map((userId) => actions[actionName](userId)));
    setSelected([]);
    setMessage(`Bulk ${label(actionName)} completed for ${selected.length} users.`);
    refresh();
  };

  const exportCsv = () => {
    const header = columns.filter(([key]) => key !== "actions" && key !== "profile_photo").map(([, title]) => title);
    const body = rows.map((row) =>
      [
        row.user_id,
        row.full_name,
        row.business_name,
        row.organization,
        row.email,
        row.phone,
        row.purchased_plan,
        row.campaign_status,
        (row.connected_platforms || []).map((item) => item.platform).join(" "),
        row.remaining_posts,
        row.remaining_days,
        row.assigned_ai_agent,
        formatDate(row.last_ai_run),
        formatDate(row.created_date),
      ].map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")
    );
    const blob = new Blob([[header.join(","), ...body].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "vivent-post-management.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const sortBy = (key) => {
    if (["profile_photo", "connected_platforms", "actions"].includes(key)) return;
    setSort((current) => ({ key, dir: current.key === key && current.dir === "asc" ? "desc" : "asc" }));
  };

  return (
    <section className="min-w-0 space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h3 className="text-2xl font-black text-slate-950">Post Management</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">Manage AI social media campaigns and connected social media accounts.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <IconButton title="Refresh" onClick={refresh}><FaSyncAlt /></IconButton>
            <IconButton title="Filters" onClick={() => setShowFilters((value) => !value)}><FaFilter /></IconButton>
            <IconButton title="Export" onClick={exportCsv}><FaDownload /></IconButton>
            <button type="button" className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-800 px-4 text-sm font-bold text-white transition hover:bg-blue-900">
              <FaChartLine /> AI Analytics
            </button>
          </div>
        </div>

        <div className="mt-5 flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 focus-within:border-blue-800 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
          <FaSearch className="text-slate-400" />
          <input
            className="h-12 min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search user ID, name, email, organization, business, campaign, or plan"
            value={query}
          />
        </div>

        {showFilters && (
          <div className="mt-4 flex flex-wrap gap-2">
            {filters.map(([value, title]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-full px-3 py-2 text-xs font-bold ring-1 transition ${filter === value ? "bg-blue-800 text-white ring-blue-800" : "bg-white text-slate-700 ring-slate-200 hover:bg-blue-50 hover:text-blue-800"}`}
              >
                {title}
              </button>
            ))}
          </div>
        )}
      </div>

      {message && <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-800">{message}</div>}

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">{total} campaigns</span>
            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-800">{selected.length} selected</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionButton disabled={!selected.length} onClick={() => runBulk("run")} icon={<FaBolt />}>Run AI</ActionButton>
            <ActionButton disabled={!selected.length} onClick={() => runBulk("pause")} icon={<FaPause />}>Pause</ActionButton>
            <ActionButton disabled={!selected.length} onClick={() => runBulk("resume")} icon={<FaPlay />}>Resume</ActionButton>
            <ActionButton disabled={!selected.length} onClick={exportCsv} icon={<FaDownload />}>Export</ActionButton>
            <ActionButton danger disabled={!selected.length} onClick={() => runBulk("delete")} icon={<FaRegTrashAlt />}>Delete</ActionButton>
          </div>
        </div>

        <div className="max-h-[68vh] overflow-auto">
          <table className="w-full min-w-[2100px] border-separate border-spacing-0 text-left text-sm">
            <thead className="sticky top-0 z-10 bg-blue-900 text-white">
              <tr>
                <th className="w-12 border-b border-slate-800 px-3 py-3">
                  <input
                    aria-label="Select all rows"
                    checked={allVisibleSelected}
                    onChange={() => setSelected(allVisibleSelected ? selected.filter((id) => !rows.some((row) => row.user_id === id)) : [...new Set([...selected, ...rows.map((row) => row.user_id)])])}
                    type="checkbox"
                  />
                </th>
                {columns.map(([key, title]) => (
                  <ResizableTh key={key} id={key} onSort={() => sortBy(key)} setWidths={setColumnWidths} title={title} width={columnWidths[key]}>
                    {title} {sort.key === key ? (sort.dir === "asc" ? "↑" : "↓") : ""}
                  </ResizableTh>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <SkeletonRows /> : rows.map((row) => (
                <tr key={row.campaign_id} className="group cursor-pointer border-b border-slate-100 transition hover:bg-blue-50/60" onClick={() => loadDrawer(row.user_id)}>
                  <td className="border-b border-slate-100 px-3 py-3" onClick={(event) => event.stopPropagation()}>
                    <input
                      checked={selected.includes(row.user_id)}
                      onChange={() => setSelected((current) => current.includes(row.user_id) ? current.filter((id) => id !== row.user_id) : [...current, row.user_id])}
                      type="checkbox"
                    />
                  </td>
                  <Cell width={columnWidths.user_id}><span className="font-bold text-blue-800">{shortId(row.user_id)}</span></Cell>
                  <Cell width={columnWidths.profile_photo}><Avatar src={row.profile_photo} name={row.full_name} /></Cell>
                  <Cell width={columnWidths.full_name}><span className="font-bold text-slate-950">{row.full_name}</span></Cell>
                  <Cell width={columnWidths.business_name}>{row.business_name || "Not provided"}</Cell>
                  <Cell width={columnWidths.organization}>{row.organization || "Not provided"}</Cell>
                  <Cell width={columnWidths.email}>{row.email}</Cell>
                  <Cell width={columnWidths.phone}>{row.phone || "Not provided"}</Cell>
                  <Cell width={columnWidths.purchased_plan}><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-800">{row.purchased_plan}</span></Cell>
                  <Cell width={columnWidths.campaign_status}><StatusBadge status={row.campaign_status} /></Cell>
                  <Cell width={columnWidths.connected_platforms}><PlatformIcons platforms={row.connected_platforms} /></Cell>
                  <Cell width={columnWidths.remaining_posts}><b>{row.remaining_posts}</b></Cell>
                  <Cell width={columnWidths.remaining_days}><b>{row.remaining_days}</b></Cell>
                  <Cell width={columnWidths.assigned_ai_agent}>{row.assigned_ai_agent}</Cell>
                  <Cell width={columnWidths.last_ai_run}>{formatDate(row.last_ai_run)}</Cell>
                  <Cell width={columnWidths.created_date}>{formatDate(row.created_date)}</Cell>
                  <Cell width={columnWidths.actions}>
                    <div className="flex flex-wrap gap-1.5" onClick={(event) => event.stopPropagation()}>
                      <IconButton title="View" onClick={() => loadDrawer(row.user_id)}><FaEye /></IconButton>
                      <IconButton title="Edit" onClick={() => loadDrawer(row.user_id)}><FaRegCopy /></IconButton>
                      <IconButton title="Run AI" onClick={() => runAction(row.user_id, adminPostManagementApi.runAi, "AI workflow queued.")}><FaBolt /></IconButton>
                      <IconButton title="Pause Campaign" onClick={() => runAction(row.user_id, adminPostManagementApi.pause, "Campaign paused.")}><FaPause /></IconButton>
                      <IconButton title="Resume Campaign" onClick={() => runAction(row.user_id, adminPostManagementApi.resume, "Campaign resumed.")}><FaPlay /></IconButton>
                      <IconButton title="View Analytics" onClick={() => loadDrawer(row.user_id)}><FaChartLine /></IconButton>
                      <IconButton title="Generate Content" onClick={() => runAction(row.user_id, adminPostManagementApi.generateContent, "Content generation queued.")}><FaRegImage /></IconButton>
                      <IconButton title="View Posts" onClick={() => loadDrawer(row.user_id)}><FaUpload /></IconButton>
                      <IconButton title="Delete Campaign" danger onClick={() => window.confirm("Delete this campaign?") && runAction(row.user_id, adminPostManagementApi.deleteCampaign, "Campaign deleted.")}><FaRegTrashAlt /></IconButton>
                    </div>
                  </Cell>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && rows.length === 0 && <EmptyState />}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-500">Page {page} of {totalPages}</p>
          <div className="flex flex-wrap items-center gap-2">
            <select className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700" onChange={(event) => setPageSize(Number(event.target.value))} value={pageSize}>
              {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size} rows</option>)}
            </select>
            <IconButton title="Previous page" onClick={() => setPage((value) => Math.max(1, value - 1))}><FaChevronLeft /></IconButton>
            <IconButton title="Next page" onClick={() => setPage((value) => Math.min(totalPages, value + 1))}><FaChevronRight /></IconButton>
          </div>
        </div>
      </div>

      {drawerUserId && (
        <CampaignDrawer
          data={drawerData}
          loading={drawerLoading}
          onClose={() => setDrawerUserId("")}
          onPostAction={async (postId, action) => {
            await campaignsApi.postAction(postId, action);
            await loadDrawer(drawerUserId);
          }}
          onRunAction={(action, success) => runAction(drawerUserId, action, success)}
        />
      )}
    </section>
  );
}

const ResizableTh = ({ children, id, onSort, setWidths, title, width }) => {
  const start = useRef(null);
  return (
    <th className="relative border-b border-slate-800 px-3 py-3 text-xs font-black uppercase tracking-[0.12em]" style={{ width, minWidth: width }}>
      <button type="button" className="text-left" onClick={onSort} title={`Sort by ${title}`}>{children}</button>
      <span
        className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-white/0 hover:bg-blue-300"
        onMouseDown={(event) => {
          start.current = { x: event.clientX, width };
          const move = (moveEvent) => setWidths((current) => ({ ...current, [id]: Math.max(72, start.current.width + moveEvent.clientX - start.current.x) }));
          const up = () => {
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", up);
          };
          window.addEventListener("mousemove", move);
          window.addEventListener("mouseup", up);
        }}
      />
    </th>
  );
};

const Cell = ({ children, width }) => <td className="border-b border-slate-100 px-3 py-3 align-middle text-slate-700" style={{ width, minWidth: width }}>{children}</td>;

const IconButton = ({ children, danger = false, onClick, title }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className={`grid h-10 w-10 place-items-center rounded-xl border text-sm transition ${danger ? "border-red-100 bg-red-50 text-red-700 hover:bg-red-100" : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800"}`}
  >
    {children}
  </button>
);

const ActionButton = ({ children, danger = false, disabled, icon, onClick }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={`inline-flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${danger ? "bg-red-50 text-red-700 hover:bg-red-100" : "bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-800"}`}
  >
    {icon} {children}
  </button>
);

const Avatar = ({ name, src }) => (
  <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-blue-50 text-blue-800">
    {src ? <img className="h-full w-full object-cover" src={src} alt={name || "User"} /> : <FaUserCircle className="text-2xl" />}
  </div>
);

const StatusBadge = ({ status }) => (
  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ring-1 ${statusClasses[status] || statusClasses.pending}`}>{label(status)}</span>
);

const PlatformIcons = ({ platforms = [] }) => {
  const real = platforms.filter((item) => item.platform);
  if (!real.length) return <span className="text-xs font-bold text-slate-400">None</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {real.map((item) => {
        const Icon = platformIcons[item.platform] || FaHashtag;
        return (
          <span key={item.platform} className={`grid h-8 w-8 place-items-center rounded-full ring-1 ${item.connected ? "bg-blue-50 text-blue-800 ring-blue-100" : "bg-slate-100 text-slate-400 ring-slate-200"}`} title={`${label(item.platform)}: ${label(item.status || (item.connected ? "connected" : "disconnected"))}`}>
            <Icon />
          </span>
        );
      })}
    </div>
  );
};

const SkeletonRows = () => Array.from({ length: 7 }, (_, index) => (
  <tr key={index}>
    <td className="border-b border-slate-100 px-3 py-3"><div className="h-4 w-4 animate-pulse rounded bg-slate-200" /></td>
    {columns.map(([key]) => <td key={key} className="border-b border-slate-100 px-3 py-3"><div className="h-4 animate-pulse rounded bg-slate-200" /></td>)}
  </tr>
));

const EmptyState = () => (
  <div className="p-10 text-center">
    <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-800"><FaSearch /></div>
    <h4 className="mt-4 text-lg font-black text-slate-950">No paid promotion campaigns found</h4>
    <p className="mt-1 text-sm font-medium text-slate-500">Campaigns will appear here after confirmed promotion package purchases.</p>
  </div>
);

const CampaignDrawer = ({ data, loading, onClose, onPostAction, onRunAction }) => {
  const [tab, setTab] = useState("profile");
  const user = data?.user || {};
  const plan = data?.plan || {};
  const campaign = data?.campaign || {};
  const analytics = data?.analytics || {};
  const posts = data?.generated_posts || [];

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950/50" role="dialog" aria-modal="true">
      <aside className="ml-auto flex h-full w-full max-w-6xl flex-col overflow-hidden bg-white shadow-2xl">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <Avatar src={user.profile_picture} name={user.full_name} />
            <div>
              <h3 className="text-xl font-black text-slate-950">{user.full_name || "Campaign Profile"}</h3>
              <p className="text-sm font-semibold text-slate-500">{user.email || "Loading campaign details"}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionButton onClick={() => onRunAction(adminPostManagementApi.runAi, "AI workflow queued.")} icon={<FaBolt />}>Run AI</ActionButton>
            <ActionButton onClick={() => onRunAction(adminPostManagementApi.generateContent, "Content generation queued.")} icon={<FaRegImage />}>Generate Content</ActionButton>
            <ActionButton onClick={() => onRunAction(adminPostManagementApi.publishApproved, "Approved posts queued.")} icon={<FaUpload />}>Publish Approved</ActionButton>
            <IconButton title="Close" onClick={onClose}><FaTimes /></IconButton>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto border-b border-slate-200 px-4 py-3">
          {["profile", "accounts", "campaign", "preferences", "assets", "runs", "posts", "publishing", "analytics", "payment", "subscription", "notifications", "timeline", "logs"].map((item) => (
            <button key={item} type="button" onClick={() => setTab(item)} className={`rounded-full px-3 py-2 text-xs font-black ${tab === item ? "bg-blue-800 text-white" : "bg-slate-100 text-slate-700"}`}>{label(item)}</button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4">
          {loading ? <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-40 animate-pulse rounded-2xl bg-white" />)}</div> : (
            <>
              {tab === "profile" && <SectionGrid sections={[
                ["User Profile", user, ["user_id", "full_name", "email", "phone", "business_name", "organization", "role", "country", "registration_date", "last_login", "account_status", "subscription_status"]],
                ["Purchased Plan", plan, ["plan_name", "purchase_date", "expiration_date", "price", "remaining_posts", "posts_used", "remaining_days", "campaign_type", "campaign_frequency", "approval_mode"]],
              ]} />}
              {tab === "accounts" && <SocialAccounts accounts={data.social_accounts || []} platforms={data.platforms || []} />}
              {tab === "campaign" && <SectionGrid sections={[["AI Campaign Information", campaign, ["campaign_name", "goal", "target_audience", "brand_voice", "language", "posting_frequency", "posting_time", "hashtags", "approval_workflow", "image_generation_enabled", "auto_publish_enabled", "status", "next_scheduled_post"]]]} />}
              {tab === "preferences" && <SectionGrid sections={[
                ["Posting Preferences", data.posting_preferences || {}, ["posting_frequency", "preferred_posting_time", "timezone", "content_language", "hashtag_style", "maximum_posts_per_week", "manual_approval", "auto_publish", "generate_ai_images", "generate_videos"]],
                ["Content Preferences", data.content_preferences || {}, ["brand_colors", "brand_guidelines", "preferred_keywords", "competitor_names", "products", "services", "call_to_action", "prohibited_words", "required_hashtags", "custom_hashtags"]],
              ]} />}
              {tab === "assets" && <BrandAssets assets={data.brand_assets || []} />}
              {tab === "runs" && <RunHistory rows={data.ai_run_history || []} />}
              {tab === "posts" && <GeneratedPosts posts={posts} onPostAction={onPostAction} />}
              {tab === "publishing" && <PublishingHistory rows={data.publishing_history || []} />}
              {tab === "analytics" && <AnalyticsPanel analytics={analytics} />}
              {tab === "payment" && <SectionGrid sections={[["Payment Information", data.payment_information || {}, ["id", "amount", "status", "transaction_id", "payment_method", "created_at", "updated_at"]]]} />}
              {tab === "subscription" && <SectionGrid sections={[["Subscription Information", data.subscription_information || {}, ["id", "user_id", "plan_id", "status", "started_at", "updated_at"]]]} />}
              {tab === "notifications" && <SimpleList rows={data.notifications || []} titleKey="title" bodyKey="message" />}
              {tab === "timeline" && <SimpleList rows={data.campaign_timeline || []} titleKey="action" bodyKey="status" />}
              {tab === "logs" && <SimpleList rows={data.logs || []} titleKey="action" bodyKey="status" />}
            </>
          )}
        </div>
      </aside>
    </div>
  );
};

const SectionGrid = ({ sections }) => (
  <div className="grid gap-4 xl:grid-cols-2">
    {sections.map(([title, values, keys]) => (
      <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h4 className="text-lg font-black text-slate-950">{title}</h4>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {keys.map((key) => (
            <div key={key} className="rounded-xl bg-slate-50 p-3">
              <dt className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{label(key)}</dt>
              <dd className="mt-1 break-words text-sm font-bold text-slate-900">{Array.isArray(values?.[key]) ? values[key].join(" ") : String(key.includes("date") || key.includes("login") || key.includes("post") ? values?.[key] ?? "Not available" : values?.[key] ?? "Not provided")}</dd>
            </div>
          ))}
        </dl>
      </article>
    ))}
  </div>
);

const SocialAccounts = ({ accounts, platforms }) => (
  <div className="space-y-4">
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h4 className="text-lg font-black text-slate-950">Connected Platforms</h4>
      <div className="mt-4"><PlatformIcons platforms={platforms} /></div>
    </article>
    <div className="grid gap-4 xl:grid-cols-2">
      {accounts.map((account) => {
        const Icon = platformIcons[account.platform] || FaHashtag;
        return <article key={account.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-blue-50 text-blue-800"><Icon /></span><div><h4 className="font-black text-slate-950">{label(account.platform)}</h4><p className="text-sm font-semibold text-slate-500">@{account.username}</p></div></div>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {["profile_url", "connection_status", "account_type", "followers", "connected_date", "token_status", "last_sync", "last_published_post"].map((key) => <div key={key} className="rounded-xl bg-slate-50 p-3"><dt className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{label(key)}</dt><dd className="mt-1 break-words text-sm font-bold text-slate-900">{String(account[key] ?? "Not available")}</dd></div>)}
          </dl>
        </article>;
      })}
      {!accounts.length && <EmptyPanel text="No connected social accounts found for this user." />}
    </div>
  </div>
);

const RunHistory = ({ rows }) => <DataTable rows={rows} columns={["run_time", "triggered_by", "duration", "posts_generated", "images_generated", "status", "error_message"]} />;

const PublishingHistory = ({ rows }) => <DataTable rows={rows} columns={["platform", "caption", "media", "published_time", "status", "response", "post_url"]} />;

const DataTable = ({ rows, columns: tableColumns }) => (
  <div className="overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
    <table className="w-full min-w-[900px] text-left text-sm">
      <thead className="bg-blue-900 text-white">
        <tr>{tableColumns.map((column) => <th key={column} className="px-4 py-3 text-xs font-black uppercase tracking-[0.12em]">{label(column)}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row) => <tr key={row.id || JSON.stringify(row)} className="border-b border-slate-100">{tableColumns.map((column) => <td key={column} className="px-4 py-3 text-slate-700">{typeof row[column] === "object" && row[column] ? JSON.stringify(row[column]) : String(row[column] ?? "Not available")}</td>)}</tr>)}
      </tbody>
    </table>
    {!rows.length && <EmptyPanel text="No records found." />}
  </div>
);

const GeneratedPosts = ({ posts, onPostAction }) => (
  <div className="grid gap-4 xl:grid-cols-2">
    {posts.map((post) => {
      const Icon = platformIcons[post.platform] || FaHashtag;
      return <article key={post.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {post.image_url ? <img className="h-56 w-full object-cover" src={post.image_url} alt="Generated campaign creative" /> : <div className="grid h-40 place-items-center bg-slate-100 text-slate-400"><FaRegImage className="text-3xl" /></div>}
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2"><span className="inline-flex items-center gap-2 font-black text-slate-950"><Icon /> {label(post.platform)}</span><StatusBadge status={post.status} /></div>
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{post.caption || "No caption generated."}</p>
          <div className="grid gap-2 text-xs font-semibold text-slate-500 sm:grid-cols-2">
            <span>Created: {formatDate(post.created_at)}</span><span>Scheduled: {formatDate(post.scheduled_at)}</span><span>Likes: 0</span><span>Reach: 0</span><span>Engagement: 0</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <IconButton title="Approve" onClick={() => onPostAction(post.id, "approve")}><FaCheck /></IconButton>
            <IconButton title="Reject" danger onClick={() => onPostAction(post.id, "reject")}><FaTimes /></IconButton>
            <IconButton title="Edit"><FaRegCopy /></IconButton>
            <IconButton title="Regenerate"><FaSyncAlt /></IconButton>
            <IconButton title="Publish Now" onClick={() => onPostAction(post.id, "publish_now")}><FaPlay /></IconButton>
            {post.image_url && <a title="Download" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-blue-50" href={post.image_url} download><FaDownload /></a>}
            <IconButton title="Delete" danger><FaRegTrashAlt /></IconButton>
          </div>
        </div>
      </article>;
    })}
    {!posts.length && <EmptyPanel text="No generated posts yet." />}
  </div>
);

const BrandAssets = ({ assets }) => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {assets.map((asset, index) => (
      <article key={`${asset.file_name}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-800"><FaDownload /></div>
        <h4 className="mt-4 break-words font-black text-slate-950">{asset.file_name || "Brand asset"}</h4>
        <dl className="mt-3 space-y-2 text-sm font-semibold text-slate-600">
          <div><dt className="inline font-black text-slate-900">Type: </dt><dd className="inline">{label(asset.asset_type)}</dd></div>
          <div><dt className="inline font-black text-slate-900">MIME: </dt><dd className="inline">{asset.mime_type || "Not available"}</dd></div>
          <div><dt className="inline font-black text-slate-900">Size: </dt><dd className="inline">{asset.size_bytes || 0} bytes</dd></div>
        </dl>
      </article>
    ))}
    {!assets.length && <EmptyPanel text="No brand assets uploaded yet." />}
  </div>
);

const AnalyticsPanel = ({ analytics }) => {
  const metrics = ["posts_generated", "posts_published", "reach", "impressions", "clicks", "ctr", "engagement", "growth", "follower_growth"];
  const max = Math.max(1, ...metrics.map((key) => Number(analytics[key] || 0)));
  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h4 className="text-lg font-black text-slate-950">Campaign Analytics</h4>
        <div className="mt-5 space-y-4">
          {metrics.map((key) => <div key={key}><div className="mb-1 flex justify-between text-sm font-bold text-slate-700"><span>{label(key)}</span><span>{analytics[key] || 0}</span></div><div className="h-3 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-blue-800" style={{ width: `${Math.max(4, (Number(analytics[key] || 0) / max) * 100)}%` }} /></div></div>)}
        </div>
      </article>
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h4 className="text-lg font-black text-slate-950">Highlights</h4>
        <dl className="mt-4 space-y-3">
          {["top_performing_platform", "top_performing_post", "monthly_trend"].map((key) => <div key={key} className="rounded-xl bg-slate-50 p-3"><dt className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{label(key)}</dt><dd className="mt-1 break-words text-sm font-bold text-slate-900">{typeof analytics[key] === "object" && analytics[key] ? JSON.stringify(analytics[key]) : String(analytics[key] || "Not available")}</dd></div>)}
        </dl>
      </article>
    </div>
  );
};

const SimpleList = ({ rows, titleKey, bodyKey }) => (
  <div className="space-y-3">
    {rows.map((row) => <article key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-black text-slate-950">{row[titleKey] || "Activity"}</h4><span className="text-xs font-bold text-slate-500">{formatDate(row.created_at)}</span></div><p className="mt-2 break-words text-sm font-semibold text-slate-600">{typeof row[bodyKey] === "object" ? JSON.stringify(row[bodyKey]) : row[bodyKey]}</p></article>)}
    {!rows.length && <EmptyPanel text="No notifications or logs found." />}
  </div>
);

const EmptyPanel = ({ text }) => <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm font-semibold text-slate-500">{text}</div>;
