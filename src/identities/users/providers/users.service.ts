import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserWithoutPassword } from 'src/identities/auth/interfaces/request-with-user.interface';
import { TenantService } from 'src/common/services/tenant.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { HashingProvider } from 'src/identities/auth/providers/hashing.provider';
import { User, PrismaClient } from 'generated/prisma';
import { EditUserDto } from '../dto/edit-user.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { validate as isUuid } from 'uuid';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class UsersService {
  constructor(
    private tenantService: TenantService,
    // @Inject(HashingProvider)
    private hashingProvider: HashingProvider,
  ) { }

  private async getTenantPrisma(): Promise<PrismaClient> {
    return await this.tenantService.getPrismaClient();
  }

  public async findOneByEmailWithPassword(email: string): Promise<User> {
    const prisma = await this.getTenantPrisma();
    const user = await prisma.user.findUnique({
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
    const prisma = await this.getTenantPrisma();
    const user = await prisma.user.findUnique({
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
    const prisma = await this.getTenantPrisma();
    const user = await prisma.user.findUnique({
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
    const prisma = await this.getTenantPrisma();
    const existingUser = await prisma.user.findUnique({
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
    const newUser = await prisma.user.create({
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
    const prisma = await this.getTenantPrisma();
    const user = await prisma.user.update({
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
    const prisma = await this.getTenantPrisma();
    const user = await prisma.user.findUnique({
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
    await prisma.user.update({
      where: { id: userId },
      data: { password: newHash },
    });

    return { message: 'Password changed successfully' };
  }

  public async createUserWithoutOtp(
    dto: CreateUserDto,
  ): Promise<UserWithoutPassword> {
    const prisma = await this.getTenantPrisma();
    const existingUser = await prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ForbiddenException('User already exists');
    }

    const hashedPassword = await this.hashingProvider.hashPassword(
      dto.password,
    );

    const user = await prisma.user.create({
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
    const prisma = await this.getTenantPrisma();
    const baseUrl = process.env.BASE_URL;
    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatar: file.path ? file.path.replace(/^.*\/image\/upload\//, '') : null },
    });
    user.avatar = `${baseUrl}/${user.avatar}`;

    return user;
  }

  async getTotalScoreByUserId(userId: string): Promise<number> {
    const prisma = await this.getTenantPrisma();
    const result = await prisma.challengeScore.aggregate({
      where: { user_id: userId },
      _sum: { score: true },
    });
    return result._sum.score || 0;
  }

  async getLessonStats(userId: string) {
    const prisma = await this.getTenantPrisma();
    // 1. Lấy tất cả khóa học đã đăng ký
    const enrollments = await prisma.enrollment.findMany({
      where: { user_id: userId },
      select: { product_id: true },
    });
    const enrolledCourseIds = enrollments.map(e => e.product_id);
    const totalEnrolledCourses = enrolledCourseIds.length;

    // 2. Lấy khóa học đã hoàn thành
    const completedCourses = await prisma.userCourseProgress.findMany({
      where: {
        user_id: userId,
        product_id: { in: enrolledCourseIds },
        completed_at: { not: null },
      },
      select: { product_id: true },
    });
    const totalCompletedCourses = completedCourses.length;

    // 3. Khóa học đang học = đã đăng ký - đã hoàn thành
    const totalInProgressCourses = totalEnrolledCourses - totalCompletedCourses;

    return {
      totalEnrolledLessons: totalEnrolledCourses,
      inProgressLessons: totalInProgressCourses,
      completedLessons: totalCompletedCourses,
    };
  }

  async getCourseStats(userId: string) {
    const prisma = await this.getTenantPrisma();
    // 1. Lấy tất cả khóa học đã đăng ký
    const enrollments = await prisma.enrollment.findMany({
      where: { user_id: userId },
      select: { product_id: true },
    });
    const enrolledCourseIds = enrollments.map(e => e.product_id);
    const totalEnrolledCourses = enrolledCourseIds.length;

    // 2. Lấy khóa học đã hoàn thành
    const completedCourses = await prisma.userCourseProgress.findMany({
      where: {
        user_id: userId,
        product_id: { in: enrolledCourseIds },
        completed_at: { not: null },
      },
      select: { product_id: true },
    });
    const totalCompletedCourses = completedCourses.length;

    // 3. Khóa học đang học = đã đăng ký - đã hoàn thành
    const totalInProgressCourses = totalEnrolledCourses - totalCompletedCourses;

    return {
      totalEnrolledCourses,
      inProgressCourses: totalInProgressCourses,
      completedCourses: totalCompletedCourses,
    };
  }
}
