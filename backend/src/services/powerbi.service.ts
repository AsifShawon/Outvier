import * as msal from '@azure/msal-node';

export const powerbiService = {
  /**
   * Generates an Azure AD token for Power BI
   */
  async getAccessToken(): Promise<string> {
    const tenantId = process.env.POWERBI_TENANT_ID;
    const clientId = process.env.POWERBI_CLIENT_ID;
    const clientSecret = process.env.POWERBI_CLIENT_SECRET;

    if (!tenantId || !clientId || !clientSecret) {
      throw new Error('Power BI configuration is missing in environment variables');
    }

    const msalConfig = {
      auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        clientSecret,
      },
    };

    const cca = new msal.ConfidentialClientApplication(msalConfig);
    const clientCredentialRequest = {
      scopes: ['https://analysis.windows.net/powerbi/api/.default'],
    };

    try {
      const response = await cca.acquireTokenByClientCredential(clientCredentialRequest);
      if (!response?.accessToken) {
        throw new Error('Failed to acquire access token');
      }
      return response.accessToken;
    } catch (error) {
      console.error('MSAL Error:', error);
      throw new Error('Failed to authenticate with Power BI');
    }
  },

  /**
   * Generates an Embed Token for a specific report in a workspace
   */
  async getEmbedToken(): Promise<{ embedToken: string; embedUrl: string; reportId: string }> {
    const workspaceId = process.env.POWERBI_WORKSPACE_ID;
    const reportId = process.env.POWERBI_REPORT_ID;
    const datasetId = process.env.POWERBI_DATASET_ID;

    if (!workspaceId || !reportId) {
      throw new Error('Power BI workspace/report ID is missing');
    }

    // This is useful for testing without a real Azure AD setup
    if (process.env.NODE_ENV === 'development' && process.env.POWERBI_TENANT_ID === 'mock') {
      return {
        embedToken: 'mock-embed-token',
        embedUrl: `https://app.powerbi.com/reportEmbed?reportId=${reportId}&groupId=${workspaceId}`,
        reportId,
      };
    }

    const accessToken = await this.getAccessToken();

    // Power BI REST API to generate token
    const url = `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}/GenerateToken`;
    
    const body: any = {
      accessLevel: 'View',
    };
    
    if (datasetId) {
      body.datasetId = datasetId;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Power BI API error: ${response.statusText} - ${JSON.stringify(err)}`);
    }

    const data = await response.json();
    
    return {
      embedToken: data.token,
      embedUrl: `https://app.powerbi.com/reportEmbed?reportId=${reportId}&groupId=${workspaceId}`,
      reportId,
    };
  }
};
