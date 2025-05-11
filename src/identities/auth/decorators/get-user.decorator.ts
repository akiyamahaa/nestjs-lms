import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IRequestWithUser } from '../interfaces/request-with-user.interface';
import { UserWithoutPassword } from '../interfaces/request-with-user.interface';

export const GetUser = createParamDecorator(
  (data: keyof UserWithoutPassword | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<IRequestWithUser>();
    const user = request.user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
