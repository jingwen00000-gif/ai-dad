/** access token 的载荷。sub = users.id */
export interface JwtPayload {
  sub: string;
}

/** 通过 JwtAuthGuard 后挂在 request.user 上的身份 */
export interface AuthUser {
  userId: string;
}
