import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserWithoutPassword } from 'src/identities/auth/interfaces/request-with-user.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { HashingProvider } from 'src/identities/auth/providers/hashing.provider';
import { User } from 'generated/prisma';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    // @Inject(HashingProvider)
    private hashingProvider: HashingProvider,
  ) {}

  public async findOneByEmailWithPassword(email: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (!user) {
      throw new ForbiddenException('User not found');
    }
    const baseUrl = process.env.BASE_URL;
    user.avatar = `${baseUrl}/${user.avatar}`;

    return user;
  }

  public async findOneById(userId: number): Promise<UserWithoutPassword> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new ForbiddenException('User not found');
    }
    const baseUrl = process.env.BASE_URL;
    user.avatar = `${baseUrl}/${user.avatar}`;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  public async findOneByEmail(email: string): Promise<UserWithoutPassword> {
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (!user) {
      throw new ForbiddenException('User not found');
    }
    const baseUrl = process.env.BASE_URL;
    user.avatar = `${baseUrl}/${user.avatar}`;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  public async createUser(
    createUserDto: CreateUserDto,
  ): Promise<UserWithoutPassword> {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: createUserDto.email,
      },
    });
    if (existingUser) {
      throw new ForbiddenException('User already exists');
    }
    const hashedPassword = await this.hashingProvider.hashPassword(
      createUserDto.password,
    );
    const newUser = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
        isVerified: false,
      },
    });
    const baseUrl = process.env.BASE_URL;
    if (newUser.avatar) {
      newUser.avatar = `${baseUrl}/${newUser.avatar}`;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = newUser;

    return userWithoutPassword;
  }

  public async createUserWithoutOtp(
    dto: CreateUserDto,
  ): Promise<UserWithoutPassword> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ForbiddenException('User already exists');
    }

    const hashedPassword = await this.hashingProvider.hashPassword(
      dto.password,
    );

    const user = await this.prisma.user.create({
      data: {
        ...dto,
        password: hashedPassword,
        isVerified: true, // ✅ Quan trọng: bỏ qua OTP
      },
    });

    const baseUrl = process.env.BASE_URL;
    user.avatar = user.avatar ? `${baseUrl}/${user.avatar}` : null;

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
