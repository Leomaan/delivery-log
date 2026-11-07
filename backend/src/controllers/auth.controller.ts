import type { FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../config/env';
import { loginSchema } from '../schemas/auth.schema';
import { AuthService } from '../services/auth.service';

export const ACCESS_COOKIE_NAME = 'accessToken';
export const REFRESH_COOKIE_NAME = 'refreshToken';

function setAccessCookie(reply: FastifyReply, token: string): void {
  reply.setCookie(ACCESS_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 15 * 60,
  });
}

function clearAccessCookie(reply: FastifyReply): void {
  reply.clearCookie(ACCESS_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
}

function setRefreshCookie(reply: FastifyReply, token: string, expiresAt: Date): void {
  reply.setCookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth',
    expires: expiresAt,
  });
}

function clearRefreshCookie(reply: FastifyReply): void {
  reply.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth',
  });
}

export class AuthController {
  constructor(private readonly authService: AuthService = new AuthService()) {}

  login = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const input = loginSchema.parse(request.body);
    const session = await this.authService.login(input);

    const accessToken = await reply.jwtSign({
      sub: session.user.id,
      email: session.user.email,
    });

    setAccessCookie(reply, accessToken);
    setRefreshCookie(reply, session.refreshToken, session.refreshExpiresAt);

    await reply.status(200).send({
      accessToken,
      user: session.user,
    });
  };

  refresh = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const rawRefreshToken = request.cookies[REFRESH_COOKIE_NAME];
    const session = await this.authService.refresh(rawRefreshToken);

    const accessToken = await reply.jwtSign({
      sub: session.user.id,
      email: session.user.email,
    });

    setAccessCookie(reply, accessToken);
    setRefreshCookie(reply, session.refreshToken, session.refreshExpiresAt);

    await reply.status(200).send({
      accessToken,
      user: session.user,
    });
  };

  logout = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const rawRefreshToken = request.cookies[REFRESH_COOKIE_NAME];
    await this.authService.logout(rawRefreshToken);

    clearAccessCookie(reply);
    clearRefreshCookie(reply);

    await reply.status(204).send();
  };

  me = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await reply.status(200).send({
      user: request.user,
    });
  };
}
