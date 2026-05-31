import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes, randomUUID } from 'crypto';
import { PreSurvey } from './pre-surveys.entity';
import { Customer } from '../customers/customers.entity';
import { PythonAnalysisService } from '../face-analysis/python-analysis.service';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

@Injectable()
export class PreSurveysService {
  constructor(
    @InjectRepository(PreSurvey)
    private readonly repo: Repository<PreSurvey>,
    @InjectRepository(Customer)
    private readonly customers: Repository<Customer>,
    private readonly python: PythonAnalysisService,
  ) {}

  private generateToken(): string {
    return randomBytes(24).toString('base64url');
  }

  async create(userId: string, customerId: string): Promise<PreSurvey> {
    const customer = await this.customers.findOne({ where: { id: customerId, user_id: userId } });
    if (!customer) throw new NotFoundException('고객을 찾을 수 없습니다');

    const survey = this.repo.create({
      user_id: userId,
      customer_id: customerId,
      token: this.generateToken(),
      answers: {},
    });
    return this.repo.save(survey);
  }

  async findByCustomer(userId: string, customerId: string): Promise<PreSurvey[]> {
    return this.repo.find({
      where: { user_id: userId, customer_id: customerId },
      order: { created_at: 'DESC' },
    });
  }

  async findByToken(token: string): Promise<{ survey: PreSurvey; customer: Customer }> {
    const survey = await this.repo.findOne({ where: { token } });
    if (!survey) throw new NotFoundException('사전설문지를 찾을 수 없습니다');
    const customer = await this.customers.findOne({ where: { id: survey.customer_id } });
    if (!customer) throw new NotFoundException('고객을 찾을 수 없습니다');
    return { survey, customer };
  }

  async saveAnswers(token: string, answers: Record<string, unknown>, submit = false): Promise<PreSurvey> {
    const survey = await this.repo.findOne({ where: { token } });
    if (!survey) throw new NotFoundException('사전설문지를 찾을 수 없습니다');
    survey.answers = answers;
    if (submit) survey.filled_at = new Date();
    return this.repo.save(survey);
  }

  async remove(userId: string, id: string): Promise<void> {
    const survey = await this.repo.findOne({ where: { id, user_id: userId } });
    if (!survey) throw new NotFoundException('사전설문지를 찾을 수 없습니다');
    await this.repo.remove(survey);
  }

  async createUploadUrl(token: string, opts: { contentType: string; ext?: string; contentLength?: number }) {
    if (!opts.contentType?.startsWith('image/')) {
      throw new BadRequestException('이미지 파일만 업로드할 수 있습니다');
    }
    if (opts.contentLength != null && opts.contentLength > MAX_UPLOAD_BYTES) {
      throw new BadRequestException(`이미지 크기가 너무 큽니다 (최대 ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB)`);
    }
    const survey = await this.repo.findOne({ where: { token } });
    if (!survey) throw new NotFoundException('사전설문지를 찾을 수 없습니다');
    if (survey.filled_at) throw new BadRequestException('이미 제출된 사전설문지입니다');

    const ext = (opts.ext || extFromContentType(opts.contentType)).replace('.', '');
    const key = `pre-surveys/${survey.customer_id}/${randomUUID()}.${ext}`;
    return this.python.createUploadPresignedUrl({ key, contentType: opts.contentType });
  }
}

function extFromContentType(contentType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
  };
  return map[contentType.toLowerCase()] || 'bin';
}
