// src/routes/webauthnTest.ts
import { generateAuthenticationOptions } from '@simplewebauthn/server';

const webauthnTestRoutes = async (fastify) => {
  const RP_ID = process.env.RP_ID ?? 'ahpunjabdev.itsarsh.dev'; // or 'itsarsh.dev'

  fastify.post('/v1/auth/webauthn/test/usernameless-options', async (_req, reply) => {
    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      userVerification: 'preferred',
      timeout: 30_000,
      // ⛔ DO NOT include allowCredentials → usernameless probe
    });

    // If you later want to verify, you can stash the challenge in a session/cookie here.
    return reply.send({ options });
  });
};

export default webauthnTestRoutes;
