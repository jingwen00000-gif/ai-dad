import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** 标注不需要登录的接口，如健康检查、微信登录 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
