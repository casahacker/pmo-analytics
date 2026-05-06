import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import NodeCache from "node-cache";
import dotenv from "dotenv";
import session from "express-session";
import { createRequire } from "module";
const FileStore = createRequire(import.meta.url)("session-file-store");
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

dotenv.config();

declare global {
  namespace Express {
    interface User { id: string; name: string; email: string; }
  }
}

const app = express();
const PORT = 3000;
const cache = new NodeCache({ stdTTL: 1200 });

const JIRA_BASE_URL_RAW = process.env.JIRA_BASE_URL || "https://jira.casahacker.org";
const JIRA_BASE_URL = JIRA_BASE_URL_RAW.startsWith("http") ? JIRA_BASE_URL_RAW : `https://${JIRA_BASE_URL_RAW}`;
const JIRA_TOKEN = process.env.JIRA_TOKEN;
const APP_URL = process.env.APP_URL || "https://pmo-analytics.casahacker.org";
const DOCUMENSO_API_KEY = process.env.DOCUMENSO_API_KEY || "";
const DOCUMENSO_URL = (process.env.DOCUMENSO_URL || "https://documenso.casahacker.org").replace(/\/$/, "");

const TARGET_PROJECTS = [
  "HP54707", "HC255002", "CMS", "ED26", "FLS",
  "HS26", "HCAI2025", "MP", "PER2025", "QEM2527"
];

const FIELDS_TO_FETCH = [
  "summary", "status", "issuetype", "priority",
  "assignee", "reporter", "created", "updated",
  "description", "labels", "components",
  "project", "parent", "subtasks",
  "customfield_10108",
  "customfield_10109",
  "customfield_10111",
  "customfield_10500",
  "customfield_10501",
];

async function fetchJiraIssues(projectKey: string) {
  const cacheKey = `issues_${projectKey}`;
  const cachedData = cache.get(cacheKey) as any[];
  if (cachedData) return cachedData;

  const issues: any[] = [];
  let startAt = 0;
  const maxResults = 100;
  let total = 1;

  console.log(`[Jira] Buscando issues para o projeto: ${projectKey}...`);

  try {
    if (!JIRA_TOKEN) throw new Error("JIRA_TOKEN não configurado.");

    while (startAt < total) {
      const response = await axios.get(`${JIRA_BASE_URL}/rest/api/2/search`, {
        params: {
          jql: `project = ${projectKey} ORDER BY created ASC`,
          fields: FIELDS_TO_FETCH.join(","),
          startAt,
          maxResults,
        },
        headers: { Authorization: `Bearer ${JIRA_TOKEN}` },
      });
      issues.push(...response.data.issues);
      total = response.data.total;
      startAt += maxResults;
    }
    console.log(`[Jira] Sucesso: ${issues.length} issues para ${projectKey}.`);
    cache.set(cacheKey, issues);
    return issues;
  } catch (error: any) {
    console.error(`[Jira] Erro ao buscar ${projectKey}:`, error.response?.data || error.message);
    return [];
  }
}

// Nginx proxy
app.set("trust proxy", 1);

// Session
const SessionFileStore = FileStore(session);
app.use(session({
  store: new SessionFileStore({ path: "/app/data/sessions", ttl: 28800, reapInterval: 3600 }),
  secret: process.env.SESSION_SECRET || "changeme-set-SESSION_SECRET",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    maxAge: 8 * 60 * 60 * 1000, // 8h
  },
}));

// Google OAuth — só registra se as credenciais estiverem configuradas
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const oauthConfigured = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);

if (oauthConfigured) {
  passport.use(new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `${APP_URL}/auth/google/callback`,
    },
    (_accessToken, _refreshToken, profile, done) => {
      const email = profile.emails?.[0]?.value ?? "";
      if (email.endsWith("@casahacker.org")) {
        return done(null, { id: profile.id, name: profile.displayName, email });
      }
      return done(null, false);
    }
  ));
}

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user: any, done) => done(null, user));

app.use(passport.initialize());
app.use(passport.session());

// Login page
app.get("/login", (req, res) => {
  if (req.isAuthenticated()) return res.redirect("/");
  // error handled inline in template
  res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Casa Hacker PMO Data Analytics</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;min-height:100vh;display:flex;align-items:center;justify-content:center}
    .card{background:#1e293b;border:1px solid #334155;border-radius:16px;padding:48px;width:100%;max-width:400px;text-align:center;box-shadow:0 25px 50px rgba(0,0,0,.5)}
    .logo{width:48px;height:48px;background:#10b981;border-radius:12px;margin:0 auto 20px;display:flex;align-items:center;justify-content:center}
    .logo svg{width:28px;height:28px;color:#fff}
    h1{color:#f1f5f9;font-size:20px;font-weight:700;margin-bottom:6px}
    .subtitle{color:#64748b;font-size:13px;margin-bottom:32px}
    .error{background:#450a0a;border:1px solid #991b1b;color:#fca5a5;border-radius:8px;padding:12px 16px;font-size:13px;margin-bottom:24px}
    .btn{display:inline-flex;align-items:center;gap:10px;background:#fff;color:#1e293b;border:none;border-radius:8px;padding:12px 24px;font-size:15px;font-weight:600;cursor:pointer;text-decoration:none;transition:opacity .15s;width:100%;justify-content:center}
    .btn:hover{opacity:.9}
    .btn svg{width:20px;height:20px;flex-shrink:0}
    .domain{color:#475569;font-size:12px;margin-top:20px}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
    </div>
    <h1>PMO Data Analytics</h1>
    <p class="subtitle">Associação Casa Hacker</p>
    ${req.query.error === "1" ? '<div class="error">Acesso negado. Use uma conta <strong>@casahacker.org</strong>.</div>' : req.query.error === "config" ? '<div class="error">OAuth não configurado. Adicione GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no .env.</div>' : ""}
    <a href="/auth/google" class="btn">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      Entrar com Google Workspace
    </a>
    <p class="domain">Restrito a contas @casahacker.org</p>
  </div>
</body>
</html>`);
});

// OAuth routes
app.get("/auth/google", (req, res, next) => {
  if (!oauthConfigured) return res.redirect("/login?error=config");
  passport.authenticate("google", { scope: ["email", "profile"], hd: "casahacker.org" })(req, res, next);
});

app.get("/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login?error=1" }),
  (_req, res) => res.redirect("/")
);

app.get("/auth/logout", (req, res) => {
  req.logout(() => res.redirect("/login"));
});

// Auth guard — protege tudo exceto /auth/* e /login
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path.startsWith("/auth/") || req.path === "/login" || req.path.startsWith("/fonts/")) return next();
  if (req.isAuthenticated()) return next();
  if (req.path.startsWith("/api/")) return res.status(401).json({ error: "Não autenticado" });
  return res.redirect("/auth/google");
});

app.use(express.json({ limit: "10mb" }));

// API Routes
app.get("/api/projects", async (_req, res) => {
  res.json(TARGET_PROJECTS);
});

app.get("/api/issues", async (_req, res) => {
  const allIssues: any[] = [];
  for (const project of TARGET_PROJECTS) {
    const projectIssues = await fetchJiraIssues(project);
    allIssues.push(...projectIssues);
  }
  res.json(allIssues);
});

app.post("/api/refresh", (_req, res) => {
  cache.flushAll();
  res.json({ message: "Cache cleared" });
});

app.post("/api/documenso/sign", async (req, res) => {
  const { pdfBase64, title, signatoryName, signatoryEmail } = req.body;
  if (!DOCUMENSO_API_KEY) {
    return res.status(503).json({ error: "DOCUMENSO_API_KEY não configurada." });
  }
  try {
    const authHeader = { Authorization: `Bearer ${DOCUMENSO_API_KEY}` };

    // 1. Upload do PDF via /api/files/upload-pdf (funciona com database storage)
    const pdfBuffer = Buffer.from(pdfBase64, "base64");
    const formData = new FormData();
    const pdfBlob = new Blob([pdfBuffer], { type: "application/pdf" });
    const fileName = `${title.replace(/[^a-zA-Z0-9-_ ]/g, "_")}.pdf`;
    formData.append("file", pdfBlob, fileName);

    const uploadRes = await axios.post(`${DOCUMENSO_URL}/api/files/upload-pdf`, formData, {
      headers: { ...authHeader, "Content-Type": "multipart/form-data" },
      maxBodyLength: Infinity,
    });
    const documentDataId: string = uploadRes.data.id;

    // 2. Criar envelope com recipient, passando o documentDataId via header
    const createRes = await axios.post(`${DOCUMENSO_URL}/api/v1/documents`, {
      title,
      recipients: [{ name: signatoryName, email: signatoryEmail, role: "SIGNER" }],
      meta: { message: `Relatório PMO — ${title}` },
    }, { headers: { ...authHeader, "x-document-data-id": documentDataId } });

    const { documentId, recipients } = createRes.data;
    const signingUrl: string = recipients[0].signingUrl;
    const recipientId: number = recipients[0].recipientId;

    // 3. Adicionar campo de assinatura (A4 landscape = 842×595 pts)
    await axios.post(`${DOCUMENSO_URL}/api/v1/documents/${documentId}/fields`, {
      recipientId,
      type: "SIGNATURE",
      pageNumber: 1,
      pageX: 480,
      pageY: 500,
      pageWidth: 230,
      pageHeight: 55,
    }, { headers: authHeader });

    // 4. Enviar envelope
    await axios.post(`${DOCUMENSO_URL}/api/v1/documents/${documentId}/send`,
      { sendEmail: true },
      { headers: authHeader }
    );

    res.json({ signingUrl });
  } catch (err: any) {
    const detail = err.response?.data || err.message;
    console.error("[Documenso] Erro:", detail);
    res.status(500).json({ error: "Falha ao criar envelope no Documenso.", detail });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
