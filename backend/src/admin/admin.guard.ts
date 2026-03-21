import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) throw new UnauthorizedException();

    try {
      const token = authHeader.slice(7);
      const payload = this.jwtService.verify(token);
      if (!payload.admin) throw new UnauthorizedException();
      req.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
