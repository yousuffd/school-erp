import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassElectiveOffering } from './entities/class-elective-offering.entity';
import { CreateClassElectiveOfferingDto } from './dto/create-class-elective-offering.dto';
import { scopedRepo } from '../../common/context/tenant-context';
import { ClassesService } from './classes.service';
import { SubjectsService } from '../subjects/subjects.service';

@Injectable()
export class ClassElectiveOfferingsService {
  constructor(
    @InjectRepository(ClassElectiveOffering)
    private readonly offeringRepo: Repository<ClassElectiveOffering>,
    private readonly classesService: ClassesService,
    private readonly subjectsService: SubjectsService,
  ) {}

  private repo(): Repository<ClassElectiveOffering> {
    return scopedRepo(this.offeringRepo, ClassElectiveOffering);
  }

  async create(dto: CreateClassElectiveOfferingDto): Promise<ClassElectiveOffering> {
    await this.classesService.findOne(dto.school_class_id);
    const subject = await this.subjectsService.findOne(dto.subject_id);
    if (!subject.is_elective) {
      throw new ConflictException(`Subject '${subject.name}' is not marked as an elective`);
    }
    const existing = await this.repo().findOne({
      where: { tenant_id: dto.tenant_id, school_class_id: dto.school_class_id, subject_id: dto.subject_id },
    });
    if (existing) throw new ConflictException('This subject is already offered for this class');
    return this.repo().save(this.repo().create(dto));
  }

  findForClass(schoolClassId: string): Promise<ClassElectiveOffering[]> {
    return this.repo().find({ where: { school_class_id: schoolClassId } });
  }

  async remove(id: string): Promise<void> {
    const offering = await this.repo().findOne({ where: { id } });
    if (!offering) throw new NotFoundException(`Elective offering ${id} not found`);
    await this.repo().remove(offering);
  }
}