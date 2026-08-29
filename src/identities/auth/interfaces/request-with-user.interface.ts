import { Request } from 'express';
import { User } from 'generated/prisma';

export type UserWithoutPassword = Omit<User, 'password'>;

export interface IRequestWithUser extends Omit<Request, 'user'> {
  user: UserWithoutPassword;
}
