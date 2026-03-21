import { Injectable, UnauthorizedException, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../auth/users.entity';
import { Consultation } from '../consultations/consultations.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Consultation)
    private readonly consultationsRepo: Repository<Consultation>,
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
    const user = await this.usersRepo.findOne({ where: { email, role: 'admin' } });
    if (user && await bcrypt.compare(password, user.password_hash)) {
      const token = this.jwtService.sign({ sub: user.id, email, admin: true });
      return { token };
    }

    throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
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

  async register(email: string, password: string, authHeader?: string) {
    const adminCount = await this.usersRepo.count({ where: { role: 'admin' } });
    const hasEnvAdmin = !!(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);

    // 어드민이 존재하면 인증 필요
    if (adminCount > 0 || hasEnvAdmin) {
      let isAdmin = false;
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const payload = this.jwtService.verify(authHeader.slice(7));
          isAdmin = !!payload.admin;
        } catch {}
      }
      if (!isAdmin) throw new UnauthorizedException('기존 어드민 인증이 필요합니다');
    }

    const existing = await this.usersRepo.findOne({ where: { email } });
    if (existing) throw new ConflictException('이미 존재하는 이메일입니다');

    const password_hash = await bcrypt.hash(password, 10);
    const admin = this.usersRepo.create({ email, password_hash, store_name: '관리자', owner_name: '관리자', status: 'approved', role: 'admin' });
    await this.usersRepo.save(admin);
    return { message: '어드민 계정이 생성되었습니다' };
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
