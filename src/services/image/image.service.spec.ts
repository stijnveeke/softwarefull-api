/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { ImageService } from './image.service';
import { ConfigModule } from '@nestjs/config';
import { BrowserSize } from './../../../../softwarefull-dashboard/src/enums/browserSizes';

describe('ImageService', () => {
  let service: ImageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.env.test.local', '.env.test'],
        }),
      ],
      providers: [ImageService],
    }).compile();

    service = module.get<ImageService>(ImageService);
  });

  describe('getScreenshots', () => {
    it('should return an array of Blobs', async () => {
      // Arrange
      const projectId = 'exampleProjectId';

      // Act
      const result = await service.getScreenshots(projectId);

      // Assert
      expect(result).toBeInstanceOf(Array);
    });
  });

  describe('takeScreenshot', () => {
    it('should return a Blob', async () => {
      // Arrange
      const projectId = 'exampleProjectId';
      const websiteUrl = 'https://example.com';

      // Act
      const result = await service.takeScreenshot(
        projectId,
        websiteUrl,
        BrowserSize.Desktop,
      );

      // Assert
      expect(result).toBeInstanceOf(Blob);
    });
  });

  // Add more test cases for other functions if needed
});
