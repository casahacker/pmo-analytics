<div align="center">
  <img src="https://casahacker.org/wp-content/uploads/2023/07/logo_vertical-branco.svg" height="60" alt="Casa Hacker" />
  <h1>PMO Data Analytics</h1>
  <p>Dashboard de BI e governança de dados para o Escritório de Projetos da Casa Hacker.</p>

  ![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript)
  ![Tailwind](https://img.shields.io/badge/Tailwind-v4-06b6d4?style=flat-square&logo=tailwindcss)
  ![Podman](https://img.shields.io/badge/Podman-container-892ca0?style=flat-square&logo=podman)
</div>

---

## Sobre

O **PMO Data Analytics** consome a API REST do Jira (`jira.casahacker.org`) em tempo real e transforma os dados brutos de issues em um painel estratégico com cinco módulos:

| Tab | Função |
|-----|--------|
| **Analytics** | Tendências, distribuição de status, carga por responsável, tempo de resolução |
| **Planejamento** | Cronograma mensal filtrado por due date, alertas de diligência |
| **Diligência** | Protocolo crítico: issues com campos obrigatórios ausentes ou em atraso |
| **Relatórios** | Relatório de execução mensal em PDF com parecer PMO e assinatura Documenso |
| **Notificações** | Documento formal e preview de e-mail de diligência por projeto |

O engine de auditoria calcula um **Score de Completude** para cada issue com base na presença dos campos: Responsável, Data de Entrega, Sprint, Prioridade, Data de Início, Link do Epic e Descrição.

---

## Stack

- **Runtime:** Node.js 22 + Vite 6 (build) / `tsx` (servidor)
- **UI:** React 19 + TypeScript 5
- **Estilo:** Tailwind CSS v4 — IBM Carbon Design System (IBM Plex Sans/Mono, paleta `#0f62fe`)
- **Gráficos:** Recharts
- **PDF:** `@react-pdf/renderer`
- **Auth:** Google OAuth 2.0 via `passport-google-oauth20`
- **Cache:** `node-cache` (TTL 20 min por projeto)
- **Infra:** Podman + `podman-compose` + systemd, RHEL 10

---

## Pré-requisitos

- Node.js ≥ 22 (apenas para desenvolvimento local)
- Podman + podman-compose (produção)
- Acesso à API do Jira (`jira.casahacker.org`) com token de serviço
- Conta Google OAuth configurada no Google Cloud Console
- Instância Documenso acessível (opcional — para assinatura de relatórios)

---

## Variáveis de Ambiente

Crie o arquivo `.env` na raiz do projeto:

```env
# Jira
JIRA_BASE_URL=https://jira.casahacker.org
JIRA_TOKEN=<token-basic-auth-base64>

# Autenticação Google OAuth
GOOGLE_CLIENT_ID=<client-id>
GOOGLE_CLIENT_SECRET=<client-secret>
SESSION_SECRET=<string-aleatória-segura>

# URL pública da aplicação (usada no callback OAuth e nos links dos e-mails)
APP_URL=https://pmo-analytics.casahacker.org

# Documenso (opcional)
DOCUMENSO_API_KEY=<api-key>
DOCUMENSO_URL=https://documenso.casahacker.org
```

O `JIRA_TOKEN` é um token Basic Auth em Base64: `base64("usuario@casahacker.org:token-jira")`.

---

## Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento (Vite HMR + Express API)
npm run dev
```

A aplicação sobe em `http://localhost:3000`. O servidor Express proxia as requisições `/api/*` para o Jira e serve o front via Vite em modo dev.

---

## Build e Deploy (Produção)

O deploy é feito via container Podman gerenciado pelo systemd.

```bash
# 1. Build da imagem
cd /data/apps/pmo-analytics
sudo podman-compose build --no-cache

# 2. Reiniciar o serviço
sudo systemctl restart pmo-analytics-app.service

# 3. Verificar status
sudo systemctl status pmo-analytics-app.service
```

O serviço escuta em `127.0.0.1:18087` e é exposto publicamente pelo nginx como `https://pmo-analytics.casahacker.org`.

### Arquivo de serviço systemd

`/etc/systemd/system/pmo-analytics-app.service` — gerencia o ciclo de vida do container com `restart=on-failure:3`.

---

## Estrutura do Projeto

```
pmo-analytics/
├── src/
│   ├── App.tsx                    # Componente raiz: estado global, filtros, modais
│   ├── components/
│   │   ├── Sidebar.tsx            # Navegação e filtros globais
│   │   ├── KPIWidget.tsx          # Card de métrica reutilizável
│   │   ├── StatusTag.tsx          # Badge de status com IBM color tokens
│   │   ├── InlineNotification.tsx # Alertas inline (error/warning/success/info)
│   │   ├── Button.tsx             # Botão Carbon DS (primary/secondary/ghost/danger)
│   │   ├── Dropdown.tsx           # Select customizado com acessibilidade
│   │   ├── Pagination.tsx         # Paginação com contagem de itens
│   │   ├── ChartTooltip.tsx       # Tooltip Recharts com formatação pt-BR
│   │   ├── DataTable.tsx          # Tabela genérica e ordenável
│   │   ├── RelatorioPDF.tsx       # Template PDF (@react-pdf/renderer)
│   │   └── tabs/
│   │       ├── AnalyticsTab.tsx
│   │       ├── PlanningTab.tsx
│   │       ├── DiligenceTab.tsx
│   │       ├── ReportsTab.tsx
│   │       └── NotificationsTab.tsx
│   ├── lib/
│   │   ├── analytics.ts           # Funções de agregação e cálculo de KPIs
│   │   ├── dataProcessor.ts       # Normalização de issues da API Jira
│   │   ├── constants.ts           # Cores, meses, estilos compartilhados
│   │   ├── usePagination.ts       # Hook genérico de paginação
│   │   └── utils.ts               # cn() (clsx + tailwind-merge)
│   └── index.css                  # Tema IBM Carbon (variáveis CSS + fontes)
├── server.ts                      # Servidor Express: proxy Jira, OAuth, Documenso
├── compose.yaml                   # Configuração Podman Compose
├── Containerfile                  # Imagem multi-stage (builder + runtime)
└── vite.config.ts
```

---

## Projetos Monitorados

A lista de projetos está definida em `server.ts` (`TARGET_PROJECTS`):

```
HP54707, HC255002, CMS, ED26, FLS, HS26, HCAI2025, MP, PER2025, QEM2527
```

Para adicionar ou remover projetos, edite o array e faça rebuild da imagem.

---

## API Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/issues` | Retorna todas as issues dos projetos monitorados (com cache) |
| `POST` | `/api/refresh` | Invalida o cache e força nova busca no Jira |
| `POST` | `/api/documenso/sign` | Cria envelope de assinatura no Documenso |
| `GET` | `/auth/google` | Inicia fluxo OAuth Google |
| `GET` | `/auth/google/callback` | Callback OAuth |
| `GET` | `/api/me` | Retorna usuário autenticado |
| `POST` | `/auth/logout` | Encerra sessão |

---

## Engine de Diligência

Uma issue entra em **diligência** se qualquer um destes campos estiver ausente:

- `assignee` — Responsável
- `customfield_10501` — Data de Entrega (Due Date)
- `customfield_10500` — Data de Início
- `customfield_10108` — Sprint
- `priority` — Prioridade
- `customfield_10111` — Link do Epic
- `description` — Descrição

O **Score de Completude** é calculado como `campos_preenchidos / total_campos_obrigatórios`.

---

## Licença

MIT License — © 2026 Associação Casa Hacker · CNPJ 36.038.079/0001-97

Consulte o arquivo [LICENSE](LICENSE) para os termos completos.
