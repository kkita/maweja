import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "../../components/AdminLayout";
import { apiRequest } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import {
  Smartphone, Wifi, MessageSquare, Bell, Send, RefreshCw,
  CheckCircle2, XCircle, AlertTriangle, Loader2, Bug,
} from "lucide-react";

type User = { id: number; name: string; email?: string; role: string };

type DebugResp = {
  userId: number;
  role: string;
  legacyPushTokenExists: boolean;
  legacyPushTokenPreview: string | null;
  legacyPushPlatform: string | null;
  activeTokensCount: number;
  activeTokens: Array<{
    id: number;
    platform: string;
    deviceId: string | null;
    appVersion: string | null;
    isActive: boolean;
    lastSeenAt: string | null;
    createdAt: string | null;
    tokenPreview: string | null;
  }>;
  firebaseConfigured: boolean;
};

type PushTestResp = {
  notificationId: number;
  target: { id: number; role: string };
  websocketSent: boolean;
  pushResult: {
    status: "sent" | "skipped" | "failed";
    sentCount: number;
    failedCount: number;
    invalidTokenCount: number;
    skippedReason: string | null;
    results: Array<{ token: string; status: string; reason?: string; messageId?: string }>;
  };
};

type WsTestResp = {
  ok: boolean;
  target: { id: number; role: string };
  websocketDelivered: boolean;
};

type ChatTestResp = {
  chatMessageId: number;
  notificationId: number;
  activeOrderId: number | null;
  deepLink: string;
  websocketDelivered: boolean;
  pushResult: PushTestResp["pushResult"];
  sender: { id: number; role: string; name: string };
  receiver: { id: number; role: string; name: string };
};

type LastResult = {
  channel: "push" | "ws" | "chat" | "debug";
  at: string;
  payload: any;
};

type FirebaseStatus = {
  firebaseConfigured: boolean;
  credentialsSource: string;
  projectIdHint: string | null;
  parseError: string | null;
  expectedAndroidPackages: { client: string; driver: string };
  googleServicesJsonPath: { client: string; driver: string };
  hint: string | null;
};

type TokenRow = {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  userRole: string;
  platform: string;
  deviceId: string | null;
  appVersion: string | null;
  isActive: boolean;
  lastSeenAt: string | null;
  createdAt: string | null;
  tokenPreview: string | null;
  source: string;
};

type TokensListResp = {
  filters: { role: string | null; platform: string | null; activeOnly: boolean };
  counts: { web: number; android: number; ios: number; total: number };
  tokens: TokenRow[];
  hint: string | null;
};

type TestTokenResp = {
  success: boolean;
  firebaseMessageId?: string;
  error?: { code: string; message: string };
  tokenId: number | null;
  platform: string | null;
  userId: number | null;
  deviceId?: string | null;
  deactivated?: boolean;
};

type TestUserResultRow = {
  tokenId: number;
  platform: string;
  deviceId: string | null;
  tokenPreview: string;
  success: boolean;
  firebaseMessageId?: string;
  errorCode?: string;
  errorMessage?: string;
  deactivated?: boolean;
};

type TestUserResp = {
  userId: number;
  totalTokens: number;
  results: TestUserResultRow[];
  summary: { sent: number; failed: number; deactivated: number };
  hint?: string;
};

export default function AdminPushDiagnostics() {
  const { toast } = useToast();
  const [clientId, setClientId] = useState<number | "">("");
  const [driverId, setDriverId] = useState<number | "">("");
  const [chatBody, setChatBody] = useState("Test diag MAWEJA — vérification push/chat");
  const [history, setHistory] = useState<LastResult[]>([]);
  const [debug, setDebug] = useState<DebugResp | null>(null);
  // ÉTAPE 8 — dernier résultat brut (firebase / websocket / token / platform / skippedReason)
  const [lastRaw, setLastRaw] = useState<{ label: string; at: string; payload: any } | null>(null);
  function captureRaw(label: string, payload: any) {
    setLastRaw({ label, at: new Date().toISOString(), payload });
  }

  // Listes pour pré-remplir les sélecteurs
  const { data: allUsers = [] } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const { data: fbStatus, refetch: refetchFb } = useQuery<FirebaseStatus>({ queryKey: ["/api/admin/diag/firebase-status"] });
  const clients = useMemo(() => allUsers.filter(u => u.role === "client"), [allUsers]);
  const drivers = useMemo(() => allUsers.filter(u => u.role === "driver"), [allUsers]);

  // Filtres pour la liste globale des tokens
  const [tokensRoleFilter, setTokensRoleFilter] = useState<string>("");
  const [tokensPlatformFilter, setTokensPlatformFilter] = useState<string>("");
  const [tokensActiveOnly, setTokensActiveOnly] = useState<boolean>(true);
  const tokensQueryKey = useMemo(
    () => ["/api/admin/push/tokens", { role: tokensRoleFilter || null, platform: tokensPlatformFilter || null, activeOnly: tokensActiveOnly }],
    [tokensRoleFilter, tokensPlatformFilter, tokensActiveOnly],
  );
  const { data: tokensList, refetch: refetchTokens, isLoading: tokensLoading } = useQuery<TokensListResp>({
    queryKey: tokensQueryKey,
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (tokensRoleFilter) qs.set("role", tokensRoleFilter);
      if (tokensPlatformFilter) qs.set("platform", tokensPlatformFilter);
      if (tokensActiveOnly) qs.set("activeOnly", "true");
      const r = await apiRequest(`/api/admin/push/tokens${qs.toString() ? `?${qs.toString()}` : ""}`);
      return r.json();
    },
  });

  const pushLast = history[0];
  const lastSkippedReason = useMemo(() => {
    for (const h of history) {
      if (h.channel === "push" || h.channel === "chat") {
        const r = (h.payload?.pushResult?.skippedReason ?? null) as string | null;
        if (r) return r;
      }
    }
    return null;
  }, [history]);

  function pushHistory(channel: LastResult["channel"], payload: any) {
    setHistory(h => [{ channel, at: new Date().toISOString(), payload }, ...h].slice(0, 12));
  }

  // ── Mutations ──────────────────────────────────────────────────────────────
  const debugMutation = useMutation({
    mutationFn: async (userId: number): Promise<DebugResp> => {
      const r = await apiRequest(`/api/admin/push/debug/${userId}`);
      return r.json();
    },
    onSuccess: (data) => {
      setDebug(data);
      pushHistory("debug", data);
      toast({ title: "Debug OK", description: `${data.activeTokensCount} token(s) actif(s) · Firebase ${data.firebaseConfigured ? "OK" : "non configuré"}` });
    },
    onError: (e: any) => toast({ title: "Erreur debug", description: String(e?.message || e), variant: "destructive" }),
  });

  const pushTestMutation = useMutation({
    mutationFn: async (vars: { userId: number; title: string; body: string }): Promise<PushTestResp> => {
      const r = await apiRequest(`/api/admin/push/test`, {
        method: "POST",
        body: JSON.stringify({ userId: vars.userId, title: vars.title, body: vars.body }),
      });
      return r.json();
    },
    onSuccess: (data) => {
      pushHistory("push", data);
      captureRaw("push-test (admin/push/test)", data);
      const pr = data.pushResult;
      if (pr.status === "sent") {
        toast({ title: "Push livré", description: `${pr.sentCount} appareil(s) — failed ${pr.failedCount}` });
      } else if (pr.status === "skipped") {
        toast({ title: "Push ignoré", description: `Raison : ${pr.skippedReason}`, variant: "destructive" });
      } else {
        toast({ title: "Push échoué", description: `${pr.failedCount} appareil(s) en erreur`, variant: "destructive" });
      }
    },
    onError: (e: any) => toast({ title: "Erreur push test", description: String(e?.message || e), variant: "destructive" }),
  });

  const wsTestMutation = useMutation({
    mutationFn: async (vars: { userId: number; message: string }): Promise<WsTestResp> => {
      const r = await apiRequest(`/api/admin/diag/ws`, {
        method: "POST",
        body: JSON.stringify(vars),
      });
      return r.json();
    },
    onSuccess: (data) => {
      pushHistory("ws", data);
      captureRaw("ws-test (admin/diag/ws)", data);
      toast({
        title: data.websocketDelivered ? "WebSocket livré" : "WebSocket non connecté",
        description: data.websocketDelivered
          ? "Le destinataire a reçu l'événement temps réel."
          : "Aucune session WS active pour ce user (le push reste possible).",
        variant: data.websocketDelivered ? "default" : "destructive",
      });
    },
    onError: (e: any) => toast({ title: "Erreur WS test", description: String(e?.message || e), variant: "destructive" }),
  });

  const testTokenMutation = useMutation({
    mutationFn: async (vars: { tokenId: number; title?: string; body?: string }): Promise<TestTokenResp> => {
      const r = await apiRequest(`/api/admin/push/test-token`, {
        method: "POST",
        body: JSON.stringify({
          tokenId: vars.tokenId,
          title: vars.title || "Test push direct",
          body: vars.body || "Test depuis Admin Push Diagnostics — ciblage par token précis.",
        }),
      });
      return r.json();
    },
    onSuccess: (data) => {
      pushHistory("push", { ...data, label: "test-token" });
      captureRaw("test-token (admin/push/test-token)", data);
      if (data.success) {
        toast({
          title: "Push direct envoyé",
          description: `Token #${data.tokenId} (${data.platform || "?"}) — message ${data.firebaseMessageId || "OK"}`,
        });
      } else {
        toast({
          title: data.deactivated ? "Token invalide → désactivé" : "Push direct échoué",
          description: `${data.error?.code || "?"} — ${data.error?.message || "?"}`,
          variant: "destructive",
        });
      }
      // Refresh la liste pour refléter une éventuelle désactivation
      refetchTokens();
    },
    onError: (e: any) => toast({ title: "Erreur test-token", description: String(e?.message || e), variant: "destructive" }),
  });

  // ÉTAPE 3 — Test push ciblé sur TOUS les tokens d'un user, détail par token
  const [testUserId, setTestUserId] = useState<number | "">("");
  const [testUserTitle, setTestUserTitle] = useState<string>("Test push MAWEJA");
  const [testUserBody, setTestUserBody] = useState<string>("Vérification de réception sur tous vos appareils.");
  const [testUserResult, setTestUserResult] = useState<TestUserResp | null>(null);

  const testUserMutation = useMutation({
    mutationFn: async (vars: { userId: number; title?: string; body?: string }): Promise<TestUserResp> => {
      const r = await apiRequest(`/api/admin/push/test-user`, {
        method: "POST",
        body: JSON.stringify(vars),
      });
      return r.json();
    },
    onSuccess: (data) => {
      setTestUserResult(data);
      pushHistory("push", { ...data, label: "test-user" });
      captureRaw("test-user (admin/push/test-user)", data);
      const { sent, failed, deactivated } = data.summary;
      toast({
        title: failed === 0 && sent > 0 ? "Tous les tokens ont reçu" : `Détail : ${sent} envoyés / ${failed} échoués`,
        description: deactivated > 0 ? `${deactivated} token(s) invalides désactivés automatiquement` : `User #${data.userId} — ${data.totalTokens} token(s) actifs`,
        variant: failed > 0 && sent === 0 ? "destructive" : "default",
      });
      refetchTokens();
    },
    onError: (e: any) => toast({ title: "Erreur test-user", description: String(e?.message || e), variant: "destructive" }),
  });

  const chatTestMutation = useMutation({
    mutationFn: async (vars: { senderId: number; receiverId: number; message: string }): Promise<ChatTestResp> => {
      const r = await apiRequest(`/api/admin/diag/chat`, {
        method: "POST",
        body: JSON.stringify(vars),
      });
      return r.json();
    },
    onSuccess: (data) => {
      pushHistory("chat", data);
      captureRaw("chat-diag (admin/diag/chat)", data);
      const pr = data.pushResult;
      const lines = [
        `WS ${data.websocketDelivered ? "✓" : "✗"}`,
        `Push ${pr.status}${pr.status === "sent" ? ` (${pr.sentCount})` : pr.skippedReason ? `: ${pr.skippedReason}` : ""}`,
        `Lien : ${data.deepLink}`,
      ].join(" · ");
      toast({ title: "Chat diag envoyé", description: lines });
    },
    onError: (e: any) => toast({ title: "Erreur chat diag", description: String(e?.message || e), variant: "destructive" }),
  });

  // ── Helpers UI ─────────────────────────────────────────────────────────────
  function ensure(id: number | "", label: string): id is number {
    if (typeof id !== "number" || !Number.isFinite(id) || id <= 0) {
      toast({ title: `${label} requis`, description: `Sélectionnez un ${label.toLowerCase()} dans la liste.`, variant: "destructive" });
      return false;
    }
    return true;
  }

  function badge(status: string): JSX.Element {
    const map: Record<string, { cls: string; icon: JSX.Element }> = {
      sent: { cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: <CheckCircle2 size={12} /> },
      skipped: { cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: <AlertTriangle size={12} /> },
      failed: { cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: <XCircle size={12} /> },
    };
    const m = map[status] || { cls: "bg-gray-100 text-gray-600", icon: <></> };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${m.cls}`}>
        {m.icon}{status}
      </span>
    );
  }

  // ── Rendu ──────────────────────────────────────────────────────────────────
  return (
    <AdminLayout title="Push Diagnostics">
      <div className="mb-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Test bout-en-bout des canaux <strong>WebSocket</strong>, <strong>Push FCM</strong> et <strong>Chat</strong>.
          Sélectionnez un client et un livreur, puis utilisez les boutons ci-dessous.
        </p>
      </div>

      {/* Sélecteurs ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Client cible</label>
          <select
            value={clientId === "" ? "" : String(clientId)}
            onChange={e => setClientId(e.target.value ? Number(e.target.value) : "")}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
            data-testid="select-client"
          >
            <option value="">— Choisir un client —</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>#{c.id} — {c.name} ({c.email || "?"})</option>
            ))}
          </select>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Agent (livreur) cible</label>
          <select
            value={driverId === "" ? "" : String(driverId)}
            onChange={e => setDriverId(e.target.value ? Number(e.target.value) : "")}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
            data-testid="select-driver"
          >
            <option value="">— Choisir un agent —</option>
            {drivers.map(d => (
              <option key={d.id} value={d.id}>#{d.id} — {d.name} ({d.email || "?"})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Boutons d'action ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Push */}
        <ActionCard
          icon={<Smartphone size={18} className="text-purple-500" />}
          title="Push FCM (DB + WS + FCM)"
          subtitle="Crée une notif, envoie WS + push à tous les appareils"
        >
          <button
            disabled={pushTestMutation.isPending}
            onClick={() => ensure(clientId, "Client") && pushTestMutation.mutate({ userId: clientId as number, title: "Test push client", body: "Si vous voyez ceci, le push client fonctionne." })}
            data-testid="button-push-client"
            className="action-btn bg-purple-600 hover:bg-purple-700 text-white"
          >
            {pushTestMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Push client
          </button>
          <button
            disabled={pushTestMutation.isPending}
            onClick={() => ensure(driverId, "Agent") && pushTestMutation.mutate({ userId: driverId as number, title: "Test push agent", body: "Si vous voyez ceci, le push agent fonctionne." })}
            data-testid="button-push-driver"
            className="action-btn bg-purple-600 hover:bg-purple-700 text-white"
          >
            {pushTestMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Push agent
          </button>
        </ActionCard>

        {/* WebSocket */}
        <ActionCard
          icon={<Wifi size={18} className="text-blue-500" />}
          title="WebSocket only"
          subtitle="Vérifie que le destinataire a une session temps réel ouverte"
        >
          <button
            disabled={wsTestMutation.isPending}
            onClick={() => ensure(clientId, "Client") && wsTestMutation.mutate({ userId: clientId as number, message: "Test WS client (admin)" })}
            data-testid="button-ws-client"
            className="action-btn bg-blue-600 hover:bg-blue-700 text-white"
          >
            {wsTestMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Wifi size={14} />} WS client
          </button>
          <button
            disabled={wsTestMutation.isPending}
            onClick={() => ensure(driverId, "Agent") && wsTestMutation.mutate({ userId: driverId as number, message: "Test WS agent (admin)" })}
            data-testid="button-ws-driver"
            className="action-btn bg-blue-600 hover:bg-blue-700 text-white"
          >
            {wsTestMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Wifi size={14} />} WS agent
          </button>
        </ActionCard>

        {/* Chat */}
        <ActionCard
          icon={<MessageSquare size={18} className="text-green-500" />}
          title="Chat client ↔ agent"
          subtitle="Simule un message entre les deux (admin override). Push, WS, deep-link."
        >
          <input
            value={chatBody}
            onChange={e => setChatBody(e.target.value)}
            className="w-full px-3 py-2 mb-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
            placeholder="Message à envoyer"
            data-testid="input-chat-body"
          />
          <button
            disabled={chatTestMutation.isPending}
            onClick={() => ensure(clientId, "Client") && ensure(driverId, "Agent") && chatTestMutation.mutate({ senderId: clientId as number, receiverId: driverId as number, message: chatBody })}
            data-testid="button-chat-c2d"
            className="action-btn bg-green-600 hover:bg-green-700 text-white"
          >
            {chatTestMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />} Client → Agent
          </button>
          <button
            disabled={chatTestMutation.isPending}
            onClick={() => ensure(clientId, "Client") && ensure(driverId, "Agent") && chatTestMutation.mutate({ senderId: driverId as number, receiverId: clientId as number, message: chatBody })}
            data-testid="button-chat-d2c"
            className="action-btn bg-green-600 hover:bg-green-700 text-white"
          >
            {chatTestMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />} Agent → Client
          </button>
        </ActionCard>

        {/* Debug tokens */}
        <ActionCard
          icon={<Bug size={18} className="text-amber-500" />}
          title="Voir tokens actifs"
          subtitle="Tous les push_tokens enregistrés pour le user + état Firebase"
        >
          <button
            disabled={debugMutation.isPending}
            onClick={() => ensure(clientId, "Client") && debugMutation.mutate(clientId as number)}
            data-testid="button-debug-client"
            className="action-btn bg-amber-600 hover:bg-amber-700 text-white"
          >
            {debugMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Tokens client
          </button>
          <button
            disabled={debugMutation.isPending}
            onClick={() => ensure(driverId, "Agent") && debugMutation.mutate(driverId as number)}
            data-testid="button-debug-driver"
            className="action-btn bg-amber-600 hover:bg-amber-700 text-white"
          >
            {debugMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Tokens agent
          </button>
        </ActionCard>
      </div>

      {/* Synthèse — état Firebase Admin backend (toujours visible) ──── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <Bell size={16} className="text-red-500" /> État Firebase Admin (backend)
          </h3>
          <button
            onClick={() => refetchFb()}
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            data-testid="button-refresh-firebase-status"
          >
            <RefreshCw size={12} /> Rafraîchir
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
          <Stat label="Firebase configuré" value={fbStatus ? (fbStatus.firebaseConfigured ? "Oui" : "Non") : "—"} ok={!!fbStatus?.firebaseConfigured} />
          <Stat label="Source credentials" value={fbStatus?.credentialsSource ?? "—"} ok={!!fbStatus && fbStatus.credentialsSource !== "none"} />
          <Stat label="Project ID" value={fbStatus?.projectIdHint ?? "—"} ok={!!fbStatus?.projectIdHint} />
          <Stat label="Dernier skippedReason" value={lastSkippedReason ?? "—"} ok={lastSkippedReason === null} />
        </div>
        {fbStatus?.parseError && (
          <div className="mt-3 text-xs px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300" data-testid="text-firebase-parse-error">
            <strong>Erreur parsing :</strong> {fbStatus.parseError}
          </div>
        )}
        {fbStatus?.hint && (
          <div className="mt-3 text-xs px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300">
            <AlertTriangle size={12} className="inline mr-1" /> {fbStatus.hint}
          </div>
        )}
        {fbStatus && (
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <span className="font-semibold">Package Android Client :</span>{" "}
              <span className="font-mono">{fbStatus.expectedAndroidPackages.client}</span>
            </div>
            <div>
              <span className="font-semibold">Package Android Agent :</span>{" "}
              <span className="font-mono">{fbStatus.expectedAndroidPackages.driver}</span>
            </div>
            <div className="md:col-span-2">
              <span className="font-semibold">google-services.json (chemin Gradle requis) :</span>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li><span className="font-mono">{fbStatus.googleServicesJsonPath.client}</span></li>
                <li><span className="font-mono">{fbStatus.googleServicesJsonPath.driver}</span></li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Test ciblé utilisateur — tous tokens, détail par token (ÉTAPE 3) */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5 mb-6">
        <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Send size={16} className="text-purple-500" /> Test push ciblé utilisateur (tous tokens)
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Envoie un push direct via Firebase Admin sur <strong>chaque token actif</strong> de l'utilisateur, séparément.
          Retourne le code FCM exact pour chacun (pas d'agrégation, pas de masquage).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="text-[10px] uppercase font-semibold text-gray-500 mb-1 block">Utilisateur cible</label>
            <select
              value={testUserId}
              onChange={e => setTestUserId(e.target.value ? Number(e.target.value) : "")}
              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
              data-testid="select-test-user-id"
            >
              <option value="">— Sélectionner un user —</option>
              <optgroup label="Clients">
                {clients.map(u => <option key={u.id} value={u.id}>#{u.id} · {u.name || u.email}</option>)}
              </optgroup>
              <optgroup label="Drivers / Agents">
                {drivers.map(u => <option key={u.id} value={u.id}>#{u.id} · {u.name || u.email}</option>)}
              </optgroup>
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase font-semibold text-gray-500 mb-1 block">Titre</label>
            <input
              type="text"
              value={testUserTitle}
              onChange={e => setTestUserTitle(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
              data-testid="input-test-user-title"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-semibold text-gray-500 mb-1 block">Corps du message</label>
            <input
              type="text"
              value={testUserBody}
              onChange={e => setTestUserBody(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
              data-testid="input-test-user-body"
            />
          </div>
        </div>

        <button
          disabled={!testUserId || testUserMutation.isPending}
          onClick={() => testUserMutation.mutate({
            userId: Number(testUserId),
            title: testUserTitle || undefined,
            body: testUserBody || undefined,
          })}
          className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
          data-testid="button-test-user"
        >
          {testUserMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
          Envoyer test push à tous les tokens de ce user
        </button>

        {/* Résultats détaillés par token */}
        {testUserResult && (
          <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center gap-3 mb-3 text-xs flex-wrap" data-testid="text-test-user-summary">
              <span className="font-semibold">User #{testUserResult.userId}</span>
              <span className="text-gray-500">·</span>
              <span>{testUserResult.totalTokens} token(s) actif(s)</span>
              <span className="text-gray-500">·</span>
              <span className="text-green-600 dark:text-green-400 font-semibold">{testUserResult.summary.sent} envoyés</span>
              <span className="text-gray-500">·</span>
              <span className={testUserResult.summary.failed > 0 ? "text-red-600 dark:text-red-400 font-semibold" : "text-gray-500"}>
                {testUserResult.summary.failed} échoués
              </span>
              {testUserResult.summary.deactivated > 0 && (
                <>
                  <span className="text-gray-500">·</span>
                  <span className="text-orange-600 dark:text-orange-400 font-semibold">
                    {testUserResult.summary.deactivated} désactivés
                  </span>
                </>
              )}
            </div>

            {testUserResult.hint && (
              <div className="mb-3 text-xs px-3 py-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 flex items-start gap-2" data-testid="text-test-user-hint">
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                <span>{testUserResult.hint}</span>
              </div>
            )}

            {testUserResult.results.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                      <th className="py-2 pr-2">#</th>
                      <th className="py-2 pr-2">Plateforme</th>
                      <th className="py-2 pr-2">Token</th>
                      <th className="py-2 pr-2">Device</th>
                      <th className="py-2 pr-2">Statut Firebase</th>
                      <th className="py-2 pr-2">Message ID / Erreur</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testUserResult.results.map(r => {
                      const platformColor =
                        r.platform === "android" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                        r.platform === "ios" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" :
                        "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
                      return (
                        <tr key={r.tokenId} className="border-b border-gray-100 dark:border-gray-800" data-testid={`row-test-user-result-${r.tokenId}`}>
                          <td className="py-2 pr-2 font-mono text-gray-500">{r.tokenId}</td>
                          <td className="py-2 pr-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold ${platformColor}`}>{r.platform}</span>
                          </td>
                          <td className="py-2 pr-2 font-mono text-gray-600 dark:text-gray-300">{r.tokenPreview}</td>
                          <td className="py-2 pr-2 text-gray-500">{r.deviceId || "—"}</td>
                          <td className="py-2 pr-2">
                            {r.success ? (
                              <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
                                <CheckCircle2 size={12} /> Envoyé
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
                                <XCircle size={12} /> Échec{r.deactivated ? " · désactivé" : ""}
                              </span>
                            )}
                          </td>
                          <td className="py-2 pr-2 font-mono text-[10px] text-gray-700 dark:text-gray-300 max-w-md break-all">
                            {r.success ? r.firebaseMessageId : (
                              <span>
                                <strong className="text-red-600 dark:text-red-400">{r.errorCode}</strong>
                                {r.errorMessage ? ` — ${r.errorMessage}` : ""}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Liste GLOBALE des tokens push (filtres + test direct) ───────── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <Smartphone size={16} className="text-blue-500" /> Tokens push enregistrés (vue globale)
          </h3>
          <button
            onClick={() => refetchTokens()}
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            data-testid="button-refresh-tokens"
          >
            <RefreshCw size={12} /> Rafraîchir
          </button>
        </div>

        {/* Filtres */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="text-[10px] uppercase font-semibold text-gray-500 mb-1 block">Rôle</label>
            <select
              value={tokensRoleFilter}
              onChange={e => setTokensRoleFilter(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
              data-testid="select-tokens-role"
            >
              <option value="">Tous</option>
              <option value="client">Client</option>
              <option value="driver">Agent / Driver</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase font-semibold text-gray-500 mb-1 block">Plateforme</label>
            <select
              value={tokensPlatformFilter}
              onChange={e => setTokensPlatformFilter(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
              data-testid="select-tokens-platform"
            >
              <option value="">Toutes</option>
              <option value="web">Web</option>
              <option value="android">Android</option>
              <option value="ios">iOS</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={tokensActiveOnly}
                onChange={e => setTokensActiveOnly(e.target.checked)}
                data-testid="checkbox-tokens-active-only"
              />
              <span className="font-semibold text-gray-700 dark:text-gray-300">Tokens actifs uniquement</span>
            </label>
          </div>
          <div className="flex items-end">
            <div className="text-xs text-gray-500 dark:text-gray-400" data-testid="text-tokens-counts">
              {tokensList ? (
                <>
                  Total <strong>{tokensList.counts.total}</strong> ·
                  Web <strong>{tokensList.counts.web}</strong> ·
                  Android <strong className={tokensList.counts.android === 0 ? "text-red-600" : "text-green-600"}>{tokensList.counts.android}</strong> ·
                  iOS <strong>{tokensList.counts.ios}</strong>
                </>
              ) : "—"}
            </div>
          </div>
        </div>

        {/* Hint si aucun token Android */}
        {tokensList?.hint && (
          <div className="mb-3 text-xs px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 flex items-start gap-2" data-testid="text-tokens-hint">
            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
            <span>{tokensList.hint}</span>
          </div>
        )}

        {/* Tableau */}
        {tokensLoading ? (
          <p className="text-xs text-gray-500 flex items-center gap-2"><Loader2 size={12} className="animate-spin" /> Chargement…</p>
        ) : !tokensList || tokensList.tokens.length === 0 ? (
          <p className="text-xs text-gray-500" data-testid="text-tokens-empty">Aucun token enregistré pour ces filtres.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2 pr-2">#</th>
                  <th className="py-2 pr-2">User</th>
                  <th className="py-2 pr-2">Rôle</th>
                  <th className="py-2 pr-2">Source</th>
                  <th className="py-2 pr-2">Token</th>
                  <th className="py-2 pr-2">Device</th>
                  <th className="py-2 pr-2">App</th>
                  <th className="py-2 pr-2">Actif</th>
                  <th className="py-2 pr-2">Last seen</th>
                  <th className="py-2 pr-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {tokensList.tokens.map(t => {
                  const platformColor =
                    t.platform === "android" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                    t.platform === "ios" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" :
                    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
                  return (
                    <tr key={t.id} className="border-b border-gray-100 dark:border-gray-800" data-testid={`row-tokens-${t.id}`}>
                      <td className="py-2 pr-2 font-mono text-gray-500">{t.id}</td>
                      <td className="py-2 pr-2">
                        <div className="font-semibold text-gray-900 dark:text-white">{t.userName}</div>
                        <div className="text-[10px] text-gray-500">#{t.userId} · {t.userEmail || "—"}</div>
                      </td>
                      <td className="py-2 pr-2">
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-[10px] uppercase font-semibold">{t.userRole}</span>
                      </td>
                      <td className="py-2 pr-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold ${platformColor}`}>{t.platform}</span>
                      </td>
                      <td className="py-2 pr-2 font-mono text-gray-600 dark:text-gray-300">{t.tokenPreview}</td>
                      <td className="py-2 pr-2 text-gray-500">{t.deviceId || "—"}</td>
                      <td className="py-2 pr-2 text-gray-500">{t.appVersion || "—"}</td>
                      <td className="py-2 pr-2">
                        {t.isActive
                          ? <CheckCircle2 size={14} className="text-green-500" />
                          : <XCircle size={14} className="text-red-500" />}
                      </td>
                      <td className="py-2 pr-2 text-gray-500">
                        {t.lastSeenAt ? new Date(t.lastSeenAt).toLocaleString() : "—"}
                      </td>
                      <td className="py-2 pr-2">
                        <button
                          disabled={testTokenMutation.isPending}
                          onClick={() => testTokenMutation.mutate({ tokenId: t.id })}
                          className="px-2 py-1 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-semibold flex items-center gap-1 disabled:opacity-50"
                          data-testid={`button-test-token-${t.id}`}
                          title="Envoyer un push direct via firebase-admin sur ce token précis"
                        >
                          {testTokenMutation.isPending ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />}
                          Tester
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Synthèse — tokens utilisateur + skippedReason ─────────────────── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5 mb-6">
        <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Bug size={16} className="text-amber-500" /> Synthèse utilisateur sélectionné
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <Stat label="User analysé" value={debug ? `#${debug.userId} (${debug.role})` : "—"} ok={!!debug} />
          <Stat label="Tokens actifs" value={debug ? String(debug.activeTokensCount) : "—"} ok={!!debug && debug.activeTokensCount > 0} />
          <Stat label="Legacy users.pushToken" value={debug ? (debug.legacyPushTokenExists ? "Oui" : "Non") : "—"} ok={true} />
        </div>
        {pushLast && (
          <div className="mt-4 text-xs text-gray-600 dark:text-gray-400" data-testid="text-last-result">
            Dernière action&nbsp;: <span className="font-mono">{pushLast.channel}</span> · {new Date(pushLast.at).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Détail tokens ────────────────────────────────────────────────── */}
      {debug && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5 mb-6">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Smartphone size={16} className="text-purple-500" />
            Tokens push pour user #{debug.userId} ({debug.role})
          </h3>
          {debug.legacyPushTokenExists && (
            <div className="mb-3 text-xs px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
              <span className="font-semibold">Legacy users.pushToken</span>&nbsp;:
              <span className="font-mono ml-2">{debug.legacyPushTokenPreview}</span>
              <span className="ml-2 text-gray-500">({debug.legacyPushPlatform || "?"})</span>
            </div>
          )}
          {debug.activeTokens.length === 0 ? (
            <p className="text-xs text-gray-500">Aucun token actif. Le user n'a pas (encore) enregistré son appareil.</p>
          ) : (
            <ul className="space-y-2">
              {debug.activeTokens.map(t => (
                <li key={t.id} className="text-xs px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-700 flex items-center justify-between" data-testid={`row-token-${t.id}`}>
                  <span className="font-mono">{t.tokenPreview}</span>
                  <span className="flex items-center gap-3 text-gray-500">
                    <span>{t.platform}</span>
                    {t.deviceId && <span>· {t.deviceId}</span>}
                    {t.appVersion && <span>· v{t.appVersion}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ÉTAPE 8 — Dernier résultat brut ─────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5 mb-4" data-testid="panel-last-raw">
        <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Bug size={16} className="text-indigo-500" /> Dernier résultat brut
          {lastRaw && (
            <span className="ml-auto text-[10px] font-mono text-gray-400">
              {lastRaw.label} · {new Date(lastRaw.at).toLocaleTimeString()}
            </span>
          )}
        </h3>
        {!lastRaw ? (
          <p className="text-xs text-gray-500">Lancez un test pour voir le détail brut (firebase / websocket / token / platform / skippedReason).</p>
        ) : (
          <pre
            className="text-[11px] font-mono bg-gray-50 dark:bg-gray-800 rounded-lg p-3 max-h-80 overflow-auto whitespace-pre-wrap break-words"
            data-testid="text-last-raw"
          >
            {JSON.stringify(lastRaw.payload, null, 2)}
          </pre>
        )}
      </div>

      {/* Historique des actions ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
        <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Bug size={16} className="text-gray-500" /> Historique (12 dernières actions)
        </h3>
        {history.length === 0 ? (
          <p className="text-xs text-gray-500">Aucune action exécutée pour le moment.</p>
        ) : (
          <ul className="space-y-2">
            {history.map((h, i) => {
              const pr = (h.payload?.pushResult ?? null) as ChatTestResp["pushResult"] | null;
              return (
                <li key={i} className="text-xs px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3" data-testid={`row-history-${i}`}>
                  <span className="flex items-center gap-2">
                    <span className="font-mono uppercase text-gray-500">{h.channel}</span>
                    <span className="text-gray-400">{new Date(h.at).toLocaleTimeString()}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    {h.payload?.websocketDelivered !== undefined && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${h.payload.websocketDelivered ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                        WS {h.payload.websocketDelivered ? "✓" : "✗"}
                      </span>
                    )}
                    {pr && badge(pr.status)}
                    {pr?.skippedReason && <span className="text-gray-500 font-mono">{pr.skippedReason}</span>}
                    {h.payload?.deepLink && <span className="text-gray-500 font-mono">{h.payload.deepLink}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <style>{`
        .action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          font-size: 12px;
          font-weight: 600;
          margin-right: 6px;
          margin-top: 6px;
          transition: opacity .15s;
        }
        .action-btn:disabled { opacity: .55; cursor: not-allowed; }
      `}</style>
    </AdminLayout>
  );
}

function ActionCard(props: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4">
      <div className="flex items-start gap-2 mb-3">
        {props.icon}
        <div>
          <div className="font-semibold text-sm text-gray-900 dark:text-white">{props.title}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{props.subtitle}</div>
        </div>
      </div>
      <div>{props.children}</div>
    </div>
  );
}

function Stat(props: { label: string; value: string; ok: boolean }) {
  return (
    <div className={`px-3 py-2 rounded-lg border ${props.ok ? "border-green-200 bg-green-50 dark:bg-green-900/20" : "border-amber-200 bg-amber-50 dark:bg-amber-900/20"}`}>
      <div className="text-[10px] uppercase font-semibold text-gray-500">{props.label}</div>
      <div className="text-sm font-bold text-gray-900 dark:text-white" data-testid={`stat-${props.label.toLowerCase().replace(/\s+/g, "-")}`}>
        {props.value}
      </div>
    </div>
  );
}
