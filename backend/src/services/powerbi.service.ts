import * as msal from '@azure/msal-node';
import axios from 'axios';

let clientApp: msal.ConfidentialClientApplication | null = null;

function getClientApp() {
  if (!clientApp) {
    const msalConfig = {
      auth: {
        clientId: process.env.POWERBI_CLIENT_ID || '',
        authority: `https://login.microsoftonline.com/${process.env.POWERBI_TENANT_ID || ''}`,
        clientSecret: process.env.POWERBI_CLIENT_SECRET || '',
      }
    };
    clientApp = new msal.ConfidentialClientApplication(msalConfig);
  }
  return clientApp;
}

export const powerbiService = {
  async getAccessToken(): Promise<string> {
    const clientCredentialRequest = {
      scopes: ['https://analysis.windows.net/powerbi/api/.default'],
    };

    const response = await getClientApp().acquireTokenByClientCredential(clientCredentialRequest);
    if (!response || !response.accessToken) {
      throw new Error('Failed to acquire PowerBI access token');
    }
    return response.accessToken;
  },

  async getEmbedToken() {
    const accessToken = await this.getAccessToken();
    const workspaceId = process.env.POWERBI_WORKSPACE_ID;
    const reportId = process.env.POWERBI_REPORT_ID;

    if (!workspaceId || !reportId) {
      throw new Error('PowerBI Workspace or Report ID missing');
    }

    const embedTokenUrl = `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}/GenerateToken`;
    
    const response = await axios.post(
      embedTokenUrl,
      { accessLevel: 'View' },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      token: response.data.token,
      tokenId: response.data.tokenId,
      expiration: response.data.expiration,
      reportId,
      embedUrl: `https://app.powerbi.com/reportEmbed?reportId=${reportId}&groupId=${workspaceId}`,
    };
  }
};
