import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
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

    if (!adminEmail || !adminPassword) {
      throw new UnauthorizedException('어드민 계정이 설정되지 않았습니다');
    }
    if (email !== adminEmail || password !== adminPassword) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    const token = this.jwtService.sign({ sub: 'admin', email, admin: true });
    return { token };
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
