import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IRequestWithUser } from '../interfaces/request-with-user.interface';

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<IRequestWithUser>();
    const user = request.user;

    if (!user) {
      return null;
    }
    console.log('data', data, 'user', user);

    return data ? user[data] : user;
  },
);
