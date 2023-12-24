import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ImageService } from 'src/services/image/image.service';

@Module({
  imports: [CacheModule.register()],
  providers: [ImageService],
  exports: [ImageService],
})
export class ImageModule {}
