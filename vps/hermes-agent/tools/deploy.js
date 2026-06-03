export const deployTools = [
  {
    name: 'trigger_vercel_deploy',
    description: 'Dispara un nuevo deploy en Vercel para hyc-contract-hub.',
    input_schema: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'Razón del deploy (para logs)',
        },
      },
      required: ['reason'],
    },
  },
  {
    name: 'get_latest_deployment',
    description: 'Obtiene el estado del último deployment en Vercel.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
];

export const deployHandlers = {
  async trigger_vercel_deploy({ reason }) {
    const { VERCEL_TOKEN, VERCEL_PROJECT_ID, VERCEL_TEAM_ID } = process.env;

    const url = `https://api.vercel.com/v1/deployments${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'hyc-contract-hub',
        gitSource: {
          type: 'github',
          ref: 'main',
          repoId: VERCEL_PROJECT_ID,
        },
        meta: { reason },
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(`Vercel error: ${JSON.stringify(data)}`);
    return { deploymentId: data.id, url: data.url, state: data.readyState };
  },

  async get_latest_deployment() {
    const { VERCEL_TOKEN, VERCEL_PROJECT_ID, VERCEL_TEAM_ID } = process.env;

    const params = new URLSearchParams({ projectId: VERCEL_PROJECT_ID, limit: '1' });
    if (VERCEL_TEAM_ID) params.set('teamId', VERCEL_TEAM_ID);

    const res = await fetch(`https://api.vercel.com/v6/deployments?${params}`, {
      headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(`Vercel error: ${JSON.stringify(data)}`);

    const dep = data.deployments?.[0];
    if (!dep) return { status: 'no deployments found' };

    return {
      id: dep.uid,
      url: dep.url,
      state: dep.state,
      createdAt: new Date(dep.createdAt).toISOString(),
      creator: dep.creator?.username,
    };
  },
};
