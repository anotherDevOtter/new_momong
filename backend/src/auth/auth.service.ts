import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './users.entity';
import { SignupDto, LoginDto, FindIdDto, ResetPasswordDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    const existing = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('이미 사용 중인 이메일입니다');

    const password_hash = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepo.create({
      email: dto.email,
      store_name: dto.storeName,
      owner_name: dto.ownerName,
      password_hash,
      phone: dto.phone,
      status: 'pending',
    });
    await this.usersRepo.save(user);
    return { message: '가입 신청이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다.' };
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');

    const isValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!isValid) throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');

    if (user.status === 'pending') throw new UnauthorizedException('관리자 승인 대기 중입니다');
    if (user.status === 'rejected') throw new UnauthorizedException('가입이 거절되었습니다. 관리자에게 문의하세요');

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    return {
      token,
      user: { id: user.id, email: user.email, storeName: user.store_name, ownerName: user.owner_name },
    };
  }

  async findId(dto: FindIdDto) {
    const user = await this.usersRepo.findOne({ where: { phone: dto.phone } });
    if (!user) throw new NotFoundException('해당 전화번호로 가입된 계정이 없습니다');

    // 이메일 일부 마스킹: abc***@example.com
    const [local, domain] = user.email.split('@');
    const maskedLocal =
      local.length <= 3
        ? local[0] + '***'
        : local.slice(0, 3) + '*'.repeat(local.length - 3);

    return { email: `${maskedLocal}@${domain}` };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersRepo.findOne({
      where: { email: dto.email, owner_name: dto.ownerName },
    });
    if (!user) throw new NotFoundException('이메일과 대표명이 일치하는 계정이 없습니다');

    user.password_hash = await bcrypt.hash(dto.newPassword, 10);
    await this.usersRepo.save(user);
    return { success: true };
  }

  async getMe(userId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException();
    return { id: user.id, email: user.email, storeName: user.store_name, ownerName: user.owner_name, phone: user.phone };
  }
}
