import { UsersService } from './providers/users.service';

export class UserController {
  constructor(private userService: UsersService) {}
}
