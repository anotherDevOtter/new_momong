import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Customer } from './customers.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly repo: Repository<Customer>,
  ) {}

  async findAll(userId: string, query?: string): Promise<Customer[]> {
    if (query) {
      return this.repo.find({
        where: [
          { user_id: userId, name: Like(`%${query}%`) },
          { user_id: userId, phone: Like(`%${query}%`) },
        ],
        order: { created_at: 'DESC' },
      });
    }
    return this.repo.find({ where: { user_id: userId }, order: { created_at: 'DESC' } });
  }

  async findOne(userId: string, id: string): Promise<Customer> {
    const customer = await this.repo.findOne({ where: { id, user_id: userId } });
    if (!customer) throw new NotFoundException('고객을 찾을 수 없습니다');
    return customer;
  }

  async findByPhone(userId: string, phone: string): Promise<Customer | null> {
    return this.repo.findOne({ where: { user_id: userId, phone } });
  }

  async create(userId: string, dto: CreateCustomerDto): Promise<Customer> {
    const customer = this.repo.create({ ...dto, user_id: userId });
    return this.repo.save(customer);
  }

  async upsertByPhone(userId: string, dto: CreateCustomerDto): Promise<Customer> {
    if (dto.phone) {
      const existing = await this.findByPhone(userId, dto.phone);
      if (existing) {
        Object.assign(existing, dto);
        return this.repo.save(existing);
      }
    }
    return this.create(userId, dto);
  }

  async update(userId: string, id: string, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(userId, id);
    Object.assign(customer, dto);
    return this.repo.save(customer);
  }

  async remove(userId: string, id: string): Promise<void> {
    const customer = await this.findOne(userId, id);
    await this.repo.remove(customer);
  }
}
