# PMO Data Analytics - Documentação Técnica Completa

## 1. Introdução e Propósito
O **PMO Data Analytics** é uma ferramenta de Business Intelligence (BI) de última geração desenvolvida exclusivamente para a **Casa Hacker**. Sua missão é transformar o repositório de tarefas do Jira em um painel estratégico de tomada de decisão. Diferente de dashboards nativos, esta ferramenta aplica uma camada de **Auditoria Qualitativa (Engine v2.4.1)** que identifica falhas de governança antes que elas impactem os prazos dos projetos.

---

## 2. Arquitetura do Sistema

### 2.1 Stack Tecnológica
A aplicação segue o padrão moderno de **Single Page Application (SPA)** focada em performance client-side:

*   **Runtime:** Node.js enviroment com Vite.
*   **Core UI:** React 18 (Hooks, Functional Components).
*   **Tipagem:** TypeScript (Strict mode ativo para segurança de contratos de dados).
*   **Design System:** Tailwind CSS v4 utilizando uma estética "Glassmorphism" e "Bento Grid".
*   **Data Viz:** Recharts (SVG-based) para gráficos e D3.js para lógica matemática de agrupamento.
*   **Icons:** Lucide-React.
*   **Animations:** Motion/React (Transitions, Fade-in, Staggered lists).

### 2.2 Fluxo de Dados (Data Pipeline)
1.  **Ingestão:** O frontend realiza chamadas autenticadas para a API REST do Jira (`jira.casahacker.org`).
2.  **Normalização (`/src/lib/dataProcessor.ts`):** 
    *   Os dados brutos do Jira (JSON) passam por um mapeamento de `customfields`.
    *   Campos como "Estimativa", "Data de Planejamento" e "Responsável" são sanitizados.
3.  **Análise Qualitativa:** O objeto normalizado é submetido às regras de negócio para determinar o `healthStatus`.
4.  **Estado Global:** Os dados são armazenados no estado do componente raiz e distribuídos via props/context.
5.  **Renderização:** Componentes de visualização consomem os dados filtrados em tempo real.

---

## 3. Detalhamento dos Módulos (Dashboards)

### 3.1 Módulo de Análise (Análise Qualitativa)
Focado no "Agora". O painel principal traz:
*   **Status de Saúde:** Agregado de issues críticas vs. saudáveis.
*   **Distribuição de Status:** Gráfico de rosca mostrando o pipeline (To Do, In Progress, Done).
*   **Desempenho por Squad:** Rankings de resoluções.
*   **KPIs de Velocidade:** Tempo médio de resolução e backlog growth.

### 3.2 Módulo de Planejamento
Responsável pela integridade futura. Ele foca em dois pilares:
*   **Cronograma:** Todas as tarefas do mês atual devem ter datas de início e fim.
*   **Hierarquia:** Nenhuma tarefa deve estar "órfã" (sem vínculo com um Épico ou Iniciativa).
*   **Aviso de Integridade:** Notifica visualmente quando o planejamento do período está incompleto.

### 3.3 Protocolo de Diligências (Auditoria Ativa)
Este é o módulo de conformidade. Uma issue entra em "Diligência" se:
1.  **Faltar campos obrigatórios:** (ex: Estimativa, Responsável ou Descrição).
2.  **Estar vencida:** Data de prazo inferior à data atual e status diferente de "Done".
3.  **Inconsistência de Prioridade:** Alta prioridade sem movimento por mais de 5 dias.

### 3.4 Relatórios e Notificações Formais
Interface dedicada à exportação de dados e comunicação:
*   **Engine de Notificação:** Gera textos pré-formatados detalhando as irregularidades de um projeto para envio aos gestores.
*   **Visão de Impressão:** CSS específico (`@media print`) para gerar PDFs perfeitos dos relatórios de status.

---

## 4. Governança de Código e Manutenção

### 4.1 Mapeamento de Campos (Configuração Crítica)
No arquivo `src/lib/dataProcessor.ts`, o mapeamento de campos customizados deve ser revisado caso a configuração do Jira mude:
*   `customfield_10016`: Story Points / Estimativa.
*   `customfield_10015`: Data de Planejamento / Início.

### 4.2 Lógica da "Engine" (Regras de Negócio)
As regras de "Health Score" estão centralizadas em `src/lib/analytics.ts`. Para alterar o que é considerado uma issue "Crítica", deve-se modificar a função `getHealthStatus`.

### 4.3 Padrões de Design
*   **Cores:** Paleta de profundidade utilizando `slate-900`, `slate-950` e acentos em `emerald-500` (saúde) e `rose-500` (crítico).
*   **Responsividade:** O sistema é otimizado para Desktop (1920x1080) mas adaptável para tablets através de grids flexíveis.

---

## 5. Guia de Deployment e Extensão

### Como adicionar um novo gráfico:
1.  Crie a função de processamento em `analytics.ts` que retorna o array formatado para o Recharts.
2.  Crie um novo componente `BentoCard` ou use o `KPIWidget`.
3.  Importe o gráfico e passe os dados transformados.

### Como atualizar a conexão com a API:
A aplicação está configurada para apontar para `jira.casahacker.org`. Caso o endpoint mude, altere a constante global no arquivo de serviços de API.

---
**Segurança:** A aplicação opera em modo de leitura (Read-Only) respeitando as permissões do token de acesso do usuário logado na API REST do Jira.

**Versão:** 2.4.1.2026.PROD
**Copyright:** Casa Hacker 2026. Todos os direitos reservados.
