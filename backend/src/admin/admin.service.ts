import { Injectable, UnauthorizedException, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../auth/users.entity';
import { Consultation } from '../consultations/consultations.entity';
import { AdminAccount } from './admin-account.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Consultation)
    private readonly consultationsRepo: Repository<Consultation>,
    @InjectRepository(AdminAccount)
    private readonly adminAccountsRepo: Repository<AdminAccount>,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    // 환경변수 어드민 계정 확인
    if (adminEmail && adminPassword && email === adminEmail && password === adminPassword) {
      const token = this.jwtService.sign({ sub: 'admin', email, admin: true });
      return { token };
    }

    // DB 어드민 계정 확인
    const adminAccount = await this.adminAccountsRepo.findOne({ where: { email } });
    if (adminAccount && await bcrypt.compare(password, adminAccount.password_hash)) {
      const token = this.jwtService.sign({ sub: adminAccount.id, email, admin: true });
      return { token };
    }

    throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
  }

  async register(email: string, password: string, registerCode: string, authHeader?: string) {
    const envCode = process.env.ADMIN_REGISTER_CODE;

    // 등록 코드 또는 기존 어드민 JWT 중 하나 필요
    let authorized = false;
    if (envCode && registerCode === envCode) {
      authorized = true;
    } else if (authHeader?.startsWith('Bearer ')) {
      try {
        const payload = this.jwtService.verify(authHeader.slice(7));
        authorized = !!payload.admin;
      } catch {}
    }
    if (!authorized) throw new UnauthorizedException('등록 코드 또는 어드민 인증이 필요합니다');

    const existing = await this.adminAccountsRepo.findOne({ where: { email } });
    if (existing) throw new ConflictException('이미 존재하는 이메일입니다');

    const password_hash = await bcrypt.hash(password, 10);
    const admin = this.adminAccountsRepo.create({ email, password_hash });
    await this.adminAccountsRepo.save(admin);
    return { message: '어드민 계정이 생성되었습니다' };
  }

  async getUsers() {
    const users = await this.usersRepo.find({ order: { created_at: 'DESC' } });

    const counts = await this.consultationsRepo
      .createQueryBuilder('c')
      .select('c.user_id', 'userId')
      .addSelect('COUNT(*)', 'count')
      .groupBy('c.user_id')
      .getRawMany();

    const countMap = new Map(counts.map((r) => [r.userId, parseInt(r.count)]));

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      storeName: u.store_name,
      ownerName: u.owner_name,
      phone: u.phone,
      status: u.status,
      createdAt: u.created_at,
      consultationCount: countMap.get(u.id) || 0,
    }));
  }

  async updateStatus(userId: string, status: 'approved' | 'rejected') {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('유저를 찾을 수 없습니다');
    user.status = status;
    await this.usersRepo.save(user);
    return { success: true };
  }

  async getStats() {
    const [totalUsers, pendingUsers, approvedUsers, rejectedUsers, totalConsultations] =
      await Promise.all([
        this.usersRepo.count(),
        this.usersRepo.count({ where: { status: 'pending' } }),
        this.usersRepo.count({ where: { status: 'approved' } }),
        this.usersRepo.count({ where: { status: 'rejected' } }),
        this.consultationsRepo.count(),
      ]);

    return { totalUsers, pendingUsers, approvedUsers, rejectedUsers, totalConsultations };
  }
}
