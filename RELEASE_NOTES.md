# 🚀 Nota de Lançamento: PMO Data Analytics v2.4.1
**URL Oficial:** [https://pmo-analytics.casahacker.org/](https://pmo-analytics.casahacker.org/)

Temos o prazer de anunciar o lançamento do **PMO Data Analytics**, a plataforma definitiva para gestão de governança e performance de projetos da Casa Hacker. Esta ferramenta foi desenhada para preencher a lacuna entre a execução no Jira e a visão estratégica necessária para gestores de projetos e stakeholders.

---

## 🌟 O que há de novo?

Esta versão traz a **Engine de Auditoria v2.4.1**, um motor de processamento que não apenas lê dados, mas interpreta a saúde operacional de cada iniciativa.

### 1. Dashboard de Análise Qualitativa (Insights)
Sua central de comando para entender a saúde do PMO em segundos.
*   **KPIs de Saúde do Ecossistema:** Identifique instantaneamente a proporção de issues saudáveis vs. críticas.
*   **Visualização de Carga por Responsável:** Entenda quem está sobrecarregado e quem tem capacidade disponível através da distribuição por squad.
*   **Gráficos de Tendência de Resolução:** Acompanhe se o time está ganhando ou perdendo a batalha contra o backlog.

### 2. Protocolo de Diligências (O Coração da Conformidade)
Uma funcionalidade exclusiva para garantir que os dados do Jira sejam confiáveis.
*   **Identificação de Missing Fields:** O sistema aponta automaticamente tarefas sem estimativa, descrição ou datas de planejamento.
*   **Detecção de Deadlines Críticos:** Alertas visuais para tarefas vencidas que ainda não foram concluídas.
*   **Ação Imediata:** Cada item na lista de diligências é um ponto de ação direta para o gestor.

### 3. Planejamento Mensal e Integridade
Otimize seu ciclo de planejamento com verificações automáticas.
*   **Vínculo de Épicos:** Garanta que nenhuma tarefa esteja flutuando sem uma iniciativa maior vinculada.
*   **Aviso de Integridade de Planejamento:** O sistema avisa se o seu planejamento do mês selecionado possui falhas estruturais (ex: tarefas sem datas definidas).

### 4. Notificações Formais e Relatórios
Transforme análise em comunicação executiva.
*   **Geração Automatizada de Alertas:** Crie textos de notificação baseados nos achados da auditoria para enviar aos responsáveis.
*   **Relatórios Adaptados para Impressão:** Layouts limpos e profissionais prontos para serem salvos em PDF e apresentados em reuniões de diretoria.

---

## 💡 Dicas para Gerentes de Projetos (GPs)

Para extrair o máximo de valor da ferramenta, recomendamos a seguinte rotina:

1.  **Check-up Diário de Diligências:** Comece o dia na aba de "Diligências". Se houver itens críticos lá, sua prioridade número 1 é garantir que as squads atualizem esses cards no Jira. Lembre-se: *Dados ruins geram decisões ruins.*
2.  **Validação de Planejamento (Sextas-feiras):** Antes de encerrar a semana, verifique a aba de "Planejamento". Certifique-se de que todas as tarefas da próxima semana já possuem datas e épicos atribuídos. O "Aviso de Integridade" deve estar verde.
3.  **Uso da Engine de Notificação:** Não gaste tempo escrevendo e-mails chatos cobrando atualizações. Use o recurso de "Notificação Formal" para copiar os pontos de falha detectados pelo sistema e enviar via Slack ou E-mail para os responsáveis.
4.  **Apresentação em Steering Committees:** Utilize o Dashboard de "Análise" durante as reuniões de status. A visualização de rosca e o índice de saúde transmitem muito mais confiança do que uma simples lista de tarefas.

---

## 🛠️ Informações Técnicas e Suporte

*   **Conexão Direta:** A ferramenta consome dados em tempo real da **API REST jira.casahacker.org**.
*   **Status do Sistema:** Veja o indicador no cabeçalho onde agora exibimos o status de conexão da API.
*   **Documentação Interna:** Para detalhes técnicos sobre a estrutura do código e lógica matemática, consulte o arquivo `DOCUMENTATION.md` no repositório da aplicação.

**Divirta-se explorando os dados e vamos elevar o nível da nossa gestão de projetos!**

---
*Casa Hacker - PMO Analytics Division*
*2026.PROD*
