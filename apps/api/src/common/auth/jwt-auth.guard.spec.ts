import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard.js';

const SECRET = 'test-secret-test-secret-test-secret!!';

function ctx(authorization?: string) {
  const request: Record<string, any> = { headers: authorization ? { authorization } : {} };
  const context = {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

describe('JwtAuthGuard', () => {
  const jwt = new JwtService({ secret: SECRET });
  const reflector = new Reflector();
  const guard = new JwtAuthGuard(jwt, reflector);

  it('有效 token：通过并写入 request.user', async () => {
    const token = await jwt.signAsync({ sub: 'user-1' });
    const { context, request } = ctx(`Bearer ${token}`);
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({ userId: 'user-1' });
  });

  it('缺少 token：401', async () => {
    await expect(guard.canActivate(ctx().context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('错误签名：401', async () => {
    const forged = await new JwtService({ secret: 'another-secret-another-secret-12345' }).signAsync({ sub: 'x' });
    await expect(guard.canActivate(ctx(`Bearer ${forged}`).context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('已过期：401', async () => {
    const expired = await jwt.signAsync({ sub: 'user-1' }, { expiresIn: -10 });
    await expect(guard.canActivate(ctx(`Bearer ${expired}`).context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('@Public() 接口：不校验', async () => {
    const publicReflector = { getAllAndOverride: () => true } as unknown as Reflector;
    await expect(new JwtAuthGuard(jwt, publicReflector).canActivate(ctx().context)).resolves.toBe(true);
  });
});
