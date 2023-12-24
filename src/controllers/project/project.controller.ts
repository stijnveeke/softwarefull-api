import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Controller, Get, Inject } from '@nestjs/common';
import { ImageService } from 'src/services/image/image.service';
import { ProjectService } from 'src/services/project/project.service';
import { NestProjectType } from 'src/types/NestProjectType';
import { Cache } from 'cache-manager';

@Controller('project')
export class ProjectController {
  constructor(
    private projectService: ProjectService,
    private imageService: ImageService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}
  @Get()
  async getProjects(): Promise<NestProjectType[]> {
    const projects = await this.projectService.getProjects();

    const screenshotPromises: Record<
      string,
      {
        dark: {
          desktop?: string;
          tablet?: string;
          mobile?: string;
        };
        light: {
          desktop?: string;
          tablet?: string;
          mobile?: string;
        };
      }
    > = {};

    for (const project of projects) {
      screenshotPromises[project.id] = await this.imageService.getScreenshots(
        project.id,
      );
    }

    return projects.map((project) => {
      return {
        id: project.id,
        name: project.name,
        websiteUrl: project.targets.production
          ? project.targets.production.alias[0]
          : '',
        images: screenshotPromises[project.id],
      };
    });
  }
}
