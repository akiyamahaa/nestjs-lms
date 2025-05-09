import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
// import { Reflector } from '@nestjs/core';
import { PUBLIC_ROUTES } from '../constants/public-routes';
import { IRequestWithUser } from '../interfaces/request-with-user.interface';
import { IActiveUser } from '../interfaces/active-user.interface';
import { UsersService } from 'src/identities/users/providers/users.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: IRequestWithUser = context.switchToHttp().getRequest();

    // Check if route is public
    const isPublic = PUBLIC_ROUTES.some(
      (route) =>
        route.path === request.path &&
        route.method.toLowerCase() === request.method.toLowerCase(),
    );

    if (isPublic) {
      return true;
    }

    // If not, get Authorization Header
    const authToken = request.headers.authorization;
    if (!authToken || !authToken.split(' ')[1]) {
      throw new UnauthorizedException('Missing authentication token');
    }
    const token = authToken.split(' ')[1];
    // Verify Jwt
    let decoded: IActiveUser;
    try {
      decoded = await this.jwtService.verifyAsync<IActiveUser>(token);
    } catch (err) {
      console.log(err);
      throw new UnauthorizedException('Unable to verify token');
    }

    if (!decoded.sub || !decoded.email) {
      throw new UnauthorizedException('Missing authentication token');
    }

    try {
      request.user = await this.usersService.findOneById(decoded.sub);
    } catch (err) {
      console.log(err);
      throw new UnauthorizedException('Unable to verify user');
    }

    return true;
  }
}
