import { Module } from '@nestjs/common';
import { ProjectController } from 'src/controllers/project/project.controller';
import { ProjectService } from 'src/services/project/project.service';
import { ImageModule } from '../image/image.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [ImageModule, CacheModule.register()],
  controllers: [ProjectController],
  providers: [ProjectService],
})
export class ProjectModule {}
