
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const JIRA_BASE_URL_RAW = process.env.JIRA_BASE_URL || "https://jira.casahacker.org";
const JIRA_BASE_URL = JIRA_BASE_URL_RAW.startsWith("http") ? JIRA_BASE_URL_RAW : `https://${JIRA_BASE_URL_RAW}`;
const JIRA_TOKEN = process.env.JIRA_TOKEN;

async function testConnection() {
  console.log(`Testando conexão com: ${JIRA_BASE_URL}`);
  console.log(`Token presente: ${JIRA_TOKEN ? 'Sim' : 'Não'}`);

  if (!JIRA_TOKEN) {
    console.error("ERRO: JIRA_TOKEN não encontrado no ambiente.");
    return;
  }

  try {
    const response = await axios.get(`${JIRA_BASE_URL}/rest/api/2/myself`, {
      headers: {
        Authorization: `Bearer ${JIRA_TOKEN}`,
      },
    });
    console.log("SUCESSO: Conectado como", response.data.displayName);
  } catch (error: any) {
    console.error("FALHA na conexão:");
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data:`, JSON.stringify(error.response.data));
    } else {
      console.error(error.message);
    }
  }
}

testConnection();
