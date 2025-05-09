import { Request } from 'express';
import { User } from 'generated/prisma';

type UserWithoutPassword = Omit<User, 'password'>;

export interface IRequestWithUser extends Request {
  user: UserWithoutPassword;
}
