import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserWithoutPassword } from 'src/identities/auth/interfaces/request-with-user.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { HashingProvider } from 'src/identities/auth/providers/hashing.provider';
import { User } from 'generated/prisma';
import { EditUserDto } from '../dto/edit-user.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { validate as isUuid } from 'uuid';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    // @Inject(HashingProvider)
    private hashingProvider: HashingProvider,
  ) { }

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

  public async findOneById(userId: string): Promise<UserWithoutPassword> {
    if (!isUuid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new ForbiddenException('User not found');
    }
    const baseUrl = process.env.BASE_URL;
    user.avatar = user.avatar ? `${baseUrl}/${user.avatar}` : null;
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

  async editUser(userId: string, dto: EditUserDto) {
    const user = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        ...dto,
      },
    });

    // Loại bỏ password khỏi kết quả trả về
    const { password, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Verify old password
    const pwMatches = await this.hashingProvider.comparePassword(
      dto.oldPassword,
      user.password || '',
    );
    if (!pwMatches) {
      throw new ForbiddenException('Old password is incorrect');
    }

    // Hash new password
    const newHash = await this.hashingProvider.hashPassword(dto.newPassword);

    // Update password in the database
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: newHash },
    });

    return { message: 'Password changed successfully' };
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

  async uploadAvatar(
    userId: string,
    file: Express.Multer.File
  ): Promise<UserWithoutPassword> {
    if (!file) {
      throw new ForbiddenException('File is required');
    }
    const baseUrl = process.env.BASE_URL;
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: file.path ? file.path.replace(/^.*\/image\/upload\//, '') : null },
    });
    user.avatar = `${baseUrl}/${user.avatar}`;

    return user;
  }

  async getTotalScoreByUserId(userId: string): Promise<number> {
    const result = await this.prisma.challengeScore.aggregate({
      where: { user_id: userId },
      _sum: { score: true },
    });
    return result._sum.score || 0;
  }

  async getLessonStats(userId: string) {
    // 1. Lấy danh sách product_id user đã đăng ký
    const enrollments = await this.prisma.enrollment.findMany({
      where: { user_id: userId },
      select: { product_id: true },
    });
    const productIds = enrollments.map(e => e.product_id);

    // 2. Lấy tất cả lesson thuộc các product đã đăng ký
    const lessons = await this.prisma.lesson.findMany({
      where: {
        module: {
          course_id: { in: productIds },
        },
      },
      select: { id: true },
    });
    const lessonIds = lessons.map(l => l.id);

    // 3. Lấy progress của user với các lesson này
    const progresses = await this.prisma.userLessonProgress.findMany({
      where: {
        user_id: userId,
        lesson_id: { in: lessonIds },
      },
      select: { lesson_id: true, completed_at: true },
    });

    // 4. Thống kê
    const total = lessonIds.length;
    const completed = progresses.filter(p => p.completed_at).length;
    const inProgress = progresses.filter(p => !p.completed_at).length;

    return {
      totalEnrolledLessons: total,
      inProgressLessons: inProgress,
      completedLessons: completed,
    };
  }
}
