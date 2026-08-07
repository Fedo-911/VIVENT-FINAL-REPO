import React, { useEffect, useMemo, useState } from "react";
import {
  FaArrowLeft,
  FaArrowRight,
  FaCheck,
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaTimes,
  FaUpload,
  
} from "react-icons/fa";
import { FaTiktok, FaXTwitter } from "react-icons/fa6";
import { authApi, campaignSetupApi } from "../utils/api";

const platformIcons = {
  instagram: FaInstagram,
  facebook: FaFacebook,
  linkedin: FaLinkedin,
  tiktok: FaTiktok,
  
};

const planDefaults = {
  Basic: ["facebook", "instagram"],
  Standard: ["facebook", "instagram", "tiktok"],
  Premium: ["facebook", "instagram", "linkedin", "tiktok"],
};

const steps = [
  "Campaign Information",
  "Promotion Plan",
  "Social Accounts",
  "Posting Preferences",
  "Content Preferences",
  "Media Upload",
  "Review",
];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-800 focus:ring-2 focus:ring-blue-100";

const emptyInfo = {
  campaign_name: "",
  business_event_name: "",
  campaign_goal: "",
  event_type: "",
  short_description: "",
  long_description: "",
  target_audience: "",
  country: "",
  city: "",
  language: "English",
  brand_voice: "Professional",
  website_url: "",
  contact_email: "",
  contact_phone: "",
  organization: "",
};

const emptyPosting = {
  posting_frequency: "Weekly",
  preferred_posting_time: "09:00",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  content_language: "English",
  hashtag_style: "Professional",
  maximum_posts_per_week: 3,
  manual_approval: true,
  auto_publish: false,
  generate_ai_images: true,
  generate_videos: false,
};

const emptyContent = {
  brand_colors: "",
  brand_guidelines: "",
  preferred_keywords: "",
  competitor_names: "",
  products: "",
  services: "",
  call_to_action: "",
  prohibited_words: "",
  required_hashtags: "",
  custom_hashtags: "",
};

const label = (value) => String(value || "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const accountTemplate = (platform) => ({
  platform,
  username: "",
  profile_url: "",
  page_name: "",
  business_account: true,
  connection_status: "disconnected",
  token_status: "not_connected",
  followers: "",
  business_number: "",
  display_name: "",
  last_connected: "",
});

export default function PromotionCampaignSetupWizard({ open, onClose, onCompleted }) {
  const [step, setStep] = useState(0);
  const [user, setUser] = useState(null);
  const [setup, setSetup] = useState(null);
  const [campaignInfo, setCampaignInfo] = useState(emptyInfo);
  const [posting, setPosting] = useState(emptyPosting);
  const [content, setContent] = useState(emptyContent);
  const [accounts, setAccounts] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const includedPlatforms = useMemo(() => {
    const planName = setup?.plan?.name || "Basic";
    return setup?.plan?.included_platforms?.length ? setup.plan.included_platforms : planDefaults[planName] || planDefaults.Basic;
  }, [setup]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const me = await authApi.me();
        const data = await campaignSetupApi.get(me.id);
        if (!active) return;
        setUser(me);
        setSetup(data);
        setCampaignInfo({ ...emptyInfo, ...(data.campaign_information || {}), contact_email: data.campaign_information?.contact_email || me.email || "" });
        setPosting({ ...emptyPosting, ...(data.posting_preferences || {}) });
        setContent({ ...emptyContent, ...(data.content_preferences || {}) });
        const loadedAccounts = data.social_accounts || [];
        const mergedAccounts = (data.plan?.included_platforms || planDefaults[data.plan?.name] || planDefaults.Basic).map((platform) => ({
          ...accountTemplate(platform),
          ...(loadedAccounts.find((account) => account.platform === platform) || {}),
        }));
        setAccounts(mergedAccounts);
        setAssets(data.brand_assets || []);
        setStep(0);
      } catch (loadError) {
        setError(loadError.message || "Could not load campaign setup.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [open]);

  const updateAccount = (platform, key, value) => {
    setAccounts((current) => current.map((account) => account.platform === platform ? { ...account, [key]: value } : account));
  };

  const connect = async (platform) => {
    const account = accounts.find((item) => item.platform === platform);
    try {
      const result = await campaignSetupApi.connectPlatform(account);
      const connected = result.account;
      setAccounts((current) => current.map((item) => item.platform === platform ? { ...item, ...connected } : item));
    } catch (connectError) {
      setError(connectError.message || "Could not connect this platform.");
    }
  };

  const disconnect = async (platform) => {
    try {
      await campaignSetupApi.disconnectPlatform(platform);
      setAccounts((current) => current.map((item) => item.platform === platform ? { ...item, connection_status: "disconnected", token_status: "not_connected" } : item));
    } catch (disconnectError) {
      setError(disconnectError.message || "Could not disconnect this platform.");
    }
  };

  const addFiles = (assetType, fileList) => {
    const nextAssets = Array.from(fileList || []).map((file) => ({
      asset_type: assetType,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      metadata: { captured_from: "campaign_setup_wizard" },
    }));
    setAssets((current) => [...current, ...nextAssets]);
  };

  const payload = () => ({
    campaign_information: campaignInfo,
    social_accounts: accounts,
    posting_preferences: posting,
    content_preferences: content,
    brand_assets: assets,
  });

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      await campaignSetupApi.update(user.id, payload());
      onCompleted?.();
      onClose();
    } catch (saveError) {
      setError(saveError.message || "Could not save campaign setup.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto bg-slate-950/60 p-4" role="dialog" aria-modal="true">
      <div className="mx-auto my-4 flex min-h-[calc(100vh-2rem)] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="border-b border-slate-200 bg-blue-900 p-5 text-white">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-100">Payment Successful</p>
              <h2 className="mt-1 text-2xl font-black">Promotion Campaign Setup</h2>
              <p className="mt-1 text-sm font-semibold text-blue-100">Complete this brief so the VIVENT AI agent can generate and publish accurate campaign content.</p>
            </div>
            <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white hover:bg-white/20" title="Close">
              <FaTimes />
            </button>
          </div>
          <div className="mt-5 grid gap-2 md:grid-cols-7">
            {steps.map((name, index) => (
              <button key={name} type="button" onClick={() => setStep(index)} className={`rounded-xl px-2 py-2 text-xs font-black ${index === step ? "bg-white text-blue-900" : index < step ? "bg-blue-700 text-white" : "bg-white/10 text-blue-100"}`}>
                {index + 1}. {name}
              </button>
            ))}
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-5">
          {loading ? <div className="rounded-2xl bg-white p-8 text-center font-bold text-blue-800">Loading campaign setup...</div> : (
            <>
              {error && <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}
              {step === 0 && <CampaignInformation values={campaignInfo} onChange={setCampaignInfo} />}
              {step === 1 && <PromotionPlan setup={setup} includedPlatforms={includedPlatforms} />}
              {step === 2 && <SocialAccounts accounts={accounts} includedPlatforms={includedPlatforms} onChange={updateAccount} onConnect={connect} onDisconnect={disconnect} />}
              {step === 3 && <PostingPreferences values={posting} onChange={setPosting} />}
              {step === 4 && <ContentPreferences values={content} onChange={setContent} />}
              {step === 5 && <MediaUpload assets={assets} addFiles={addFiles} removeAsset={(index) => setAssets((current) => current.filter((_, itemIndex) => itemIndex !== index))} />}
              {step === 6 && <Review campaignInfo={campaignInfo} posting={posting} content={content} accounts={accounts} assets={assets} setup={setup} includedPlatforms={includedPlatforms} />}
            </>
          )}
        </main>

        <footer className="flex flex-col gap-3 border-t border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-500">Step {step + 1} of {steps.length}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0} className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-100 px-4 text-sm font-bold text-slate-700 disabled:opacity-40">
              <FaArrowLeft /> Back
            </button>
            {step < steps.length - 1 ? (
              <button type="button" onClick={() => setStep((value) => Math.min(steps.length - 1, value + 1))} className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-800 px-4 text-sm font-bold text-white hover:bg-blue-900">
                Next <FaArrowRight />
              </button>
            ) : (
              <button type="button" onClick={submit} disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60">
                <FaCheck /> {saving ? "Submitting..." : "Submit Campaign"}
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

const Field = ({ labelText, required = false, textarea = false, value, onChange, type = "text" }) => (
  <label className="space-y-2 text-sm font-bold text-slate-900">
    {labelText} {required && <span className="text-red-600">*</span>}
    {textarea ? (
      <textarea className={`${inputClass} min-h-28 resize-y`} value={value || ""} onChange={(event) => onChange(event.target.value)} />
    ) : (
      <input className={inputClass} type={type} value={value || ""} onChange={(event) => onChange(event.target.value)} />
    )}
  </label>
);

const CampaignInformation = ({ values, onChange }) => {
  const update = (key, value) => onChange({ ...values, [key]: value });
  return <Panel title="Step 1 - Campaign Information">
    <div className="grid gap-4 md:grid-cols-2">
      {[
        ["campaign_name", "Campaign Name", true],
        ["business_event_name", "Business/Event Name", true],
        ["campaign_goal", "Campaign Goal", true],
        ["event_type", "Event Type", true],
        ["target_audience", "Target Audience", true],
        ["country", "Country", true],
        ["city", "City", true],
        ["language", "Language", true],
        ["brand_voice", "Brand Voice", true],
        ["website_url", "Website URL", false],
        ["contact_email", "Contact Email", true],
        ["contact_phone", "Contact Phone", true],
        ["organization", "Organization", false],
      ].map(([key, title, required]) => <Field key={key} labelText={title} required={required} value={values[key]} onChange={(value) => update(key, value)} type={key.includes("email") ? "email" : key.includes("url") ? "url" : "text"} />)}
      <Field labelText="Short Description" required value={values.short_description} onChange={(value) => update("short_description", value)} textarea />
      <Field labelText="Long Description" required value={values.long_description} onChange={(value) => update("long_description", value)} textarea />
    </div>
  </Panel>;
};

const PromotionPlan = ({ setup, includedPlatforms }) => <Panel title="Step 2 - Select Promotion Plan">
  <div className="rounded-2xl bg-blue-50 p-5">
    <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-800">Purchased Plan</p>
    <h3 className="mt-1 text-3xl font-black text-slate-950">{setup?.plan?.name || "Promotion"}</h3>
    <p className="mt-1 text-sm font-semibold text-slate-500">Included platforms are locked to the plan purchased during checkout.</p>
  </div>
  <div className="mt-4 grid gap-3 md:grid-cols-3">
    {includedPlatforms.map((platform) => {
      const Icon = platformIcons[platform] || FaCheck;
      return <div key={platform} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4"><span className="grid h-10 w-10 place-items-center rounded-full bg-blue-50 text-blue-800"><Icon /></span><span className="font-black text-slate-900">{label(platform)}</span></div>;
    })}
  </div>
</Panel>;

const SocialAccounts = ({ accounts, includedPlatforms, onChange, onConnect, onDisconnect }) => <Panel title="Step 3 - Connect Social Media Accounts">
  <p className="mb-4 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-800">Do not enter social media passwords. VIVENT only stores safe profile metadata here; OAuth credentials must stay encrypted on the backend/provider side.</p>
  <div className="grid gap-4 xl:grid-cols-2">
    {includedPlatforms.map((platform) => {
      const account = accounts.find((item) => item.platform === platform) || accountTemplate(platform);
      const Icon = platformIcons[platform] || FaCheck;
      return <article key={platform} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-blue-50 text-blue-800"><Icon /></span><h4 className="font-black text-slate-950">{label(platform)}</h4></div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-black ${account.connection_status === "connected" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{label(account.connection_status)}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {platform === "facebook" && <Field labelText="Page Name" required value={account.page_name} onChange={(value) => onChange(platform, "page_name", value)} />}
          {platform === "linkedin" && <Field labelText="Company Page" required value={account.page_name} onChange={(value) => onChange(platform, "page_name", value)} />}
          {/* {platform === "youtube" && <Field labelText="Channel Name" required value={account.page_name} onChange={(value) => onChange(platform, "page_name", value)} />} */}
          {platform === "whatsapp" ? <>
            <Field labelText="Business Number" required value={account.business_number} onChange={(value) => onChange(platform, "business_number", value)} />
            <Field labelText="Display Name" required value={account.display_name} onChange={(value) => onChange(platform, "display_name", value)} />
          </> : <>
            {platform !== "facebook" && platform !== "linkedin"  && <Field labelText="Username / Handle" required value={account.username} onChange={(value) => onChange(platform, "username", value)} />}
            <Field labelText={platform === "facebook" ? "Page URL" : platform === "youtube" ? "Channel URL" : "Profile URL"} required value={account.profile_url} onChange={(value) => onChange(platform, "profile_url", value)} type="url" />
          </>}
          <label className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3 text-sm font-bold text-slate-800"><input checked={!!account.business_account} onChange={(event) => onChange(platform, "business_account", event.target.checked)} type="checkbox" /> Business Account</label>
          <Field labelText="Followers" value={account.followers} onChange={(value) => onChange(platform, "followers", value)} type="number" />
        </div>
        <div className="mt-4 grid gap-2 text-xs font-bold text-slate-500 sm:grid-cols-3"><span>Last Connected: {account.last_connected || "Never"}</span><span>Token Status: {label(account.token_status)}</span><span>Status: {label(account.connection_status)}</span></div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => onConnect(platform)} className="rounded-xl bg-blue-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-900">Connect {label(platform)}</button>
          <button type="button" onClick={() => onDisconnect(platform)} className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200">Disconnect</button>
        </div>
      </article>;
    })}
  </div>
</Panel>;

const PostingPreferences = ({ values, onChange }) => {
  const update = (key, value) => onChange({ ...values, [key]: value });
  return <Panel title="Step 4 - Posting Preferences">
    <div className="grid gap-4 md:grid-cols-2">
      <Select labelText="Posting Frequency" value={values.posting_frequency} onChange={(value) => update("posting_frequency", value)} options={["Daily", "Weekly", "Monthly"]} />
      <Field labelText="Preferred Posting Time" required value={values.preferred_posting_time} onChange={(value) => update("preferred_posting_time", value)} type="time" />
      <Field labelText="Timezone" required value={values.timezone} onChange={(value) => update("timezone", value)} />
      <Field labelText="Content Language" required value={values.content_language} onChange={(value) => update("content_language", value)} />
      <Select labelText="Hashtag Style" value={values.hashtag_style} onChange={(value) => update("hashtag_style", value)} options={["Formal", "Friendly", "Professional", "Creative", "Promotional"]} />
      <Field labelText="Maximum Posts Per Week" required value={values.maximum_posts_per_week} onChange={(value) => update("maximum_posts_per_week", value)} type="number" />
      {["manual_approval", "auto_publish", "generate_ai_images", "generate_videos"].map((key) => <label key={key} className="flex items-center gap-3 rounded-xl bg-white px-3 py-3 text-sm font-bold text-slate-800 ring-1 ring-slate-200"><input checked={!!values[key]} onChange={(event) => update(key, event.target.checked)} type="checkbox" /> {label(key)}</label>)}
    </div>
  </Panel>;
};

const ContentPreferences = ({ values, onChange }) => {
  const update = (key, value) => onChange({ ...values, [key]: value });
  return <Panel title="Step 5 - Content Preferences">
    <div className="grid gap-4 md:grid-cols-2">
      {Object.keys(emptyContent).map((key) => <Field key={key} labelText={label(key)} value={values[key]} onChange={(value) => update(key, value)} textarea={["brand_guidelines", "products", "services", "prohibited_words"].includes(key)} />)}
    </div>
  </Panel>;
};

const MediaUpload = ({ assets, addFiles, removeAsset }) => <Panel title="Step 6 - Media Upload">
  <div className="grid gap-4 md:grid-cols-3">
    {["logo", "brand_images", "product_images", "event_images", "flyers", "videos", "documents"].map((type) => <label key={type} className="rounded-2xl border border-dashed border-blue-200 bg-white p-5 text-center transition hover:bg-blue-50"><FaUpload className="mx-auto text-2xl text-blue-800" /><span className="mt-2 block text-sm font-black text-slate-900">{label(type)}</span><input className="sr-only" multiple onChange={(event) => addFiles(type, event.target.files)} type="file" /></label>)}
  </div>
  <div className="mt-5 space-y-2">{assets.map((asset, index) => <div key={`${asset.file_name}-${index}`} className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-700 ring-1 ring-slate-200"><span>{label(asset.asset_type)}: {asset.file_name}</span><button type="button" onClick={() => removeAsset(index)} className="text-red-600">Remove</button></div>)}</div>
</Panel>;

const Review = ({ campaignInfo, posting, content, accounts, assets, setup, includedPlatforms }) => <div className="space-y-4">
  <PromotionPlan setup={setup} includedPlatforms={includedPlatforms} />
  <ReviewBlock title="Campaign Details" values={campaignInfo} />
  <ReviewBlock title="Posting Preferences" values={posting} />
  <ReviewBlock title="Content Preferences" values={content} />
  <ReviewBlock title="Connected Accounts" values={Object.fromEntries(accounts.map((account) => [label(account.platform), `${label(account.connection_status)} - ${account.username || account.page_name || account.profile_url || account.display_name || "Metadata pending"}`]))} />
  <ReviewBlock title="Brand Assets" values={Object.fromEntries(assets.map((asset, index) => [`${index + 1}. ${label(asset.asset_type)}`, asset.file_name]))} />
</div>;

const ReviewBlock = ({ title, values }) => <Panel title={title}>
  <dl className="grid gap-3 md:grid-cols-2">
    {Object.entries(values || {}).map(([key, value]) => <div key={key} className="rounded-xl bg-slate-50 p-3"><dt className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{label(key)}</dt><dd className="mt-1 break-words text-sm font-bold text-slate-900">{String(value || "Not provided")}</dd></div>)}
  </dl>
</Panel>;

const Select = ({ labelText, onChange, options, value }) => <label className="space-y-2 text-sm font-bold text-slate-900">{labelText}<select className={inputClass} value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;

const Panel = ({ children, title }) => <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="mb-4 text-xl font-black text-slate-950">{title}</h3>{children}</section>;

