/* eslint-disable prettier/prettier */
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { VercelProjectType } from '../../types/VercelProjectType';
import { Injectable } from '@nestjs/common';
import { ImageService } from '../image/image.service';

@Injectable()
export class ProjectService {
  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private imageService: ImageService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async checkForNewProjects() {
    console.log('Checking for new projects');
    const projects = await this.getProjects();

    const screenshotPromises: Promise<{
      dark: {
        desktop: Blob;
        tablet: Blob;
        mobile: Blob;
      };
      light: {
        desktop: Blob;
        tablet: Blob;
        mobile: Blob;
      };
    }>[] = [];
    for (const project of projects) {
      // TODO check if project is already in database
      const screenshots = await this.imageService.getScreenshots(project.id);
      if (project.targets.production === undefined) {
        continue;
      }
      if (
        screenshots.dark.desktop !== undefined &&
        screenshots.dark.tablet !== undefined &&
        screenshots.dark.mobile !== undefined &&
        screenshots.light.desktop !== undefined &&
        screenshots.light.tablet !== undefined &&
        screenshots.light.mobile !== undefined
      ) {
        continue;
      }

      console.log('Found new project: ' + project.name);
      console.log('Attempting screenshots of project: ' + project.name);
      screenshotPromises.push(
        this.imageService
          .takeScreenshotsOfProject(
            project.id,
            'https://' + project.targets.production.alias[0],
          )
          .then((blob) => {
            console.log('Screenshot taken from project: ' + project.name);
            return blob;
          }),
      );
    }

    await Promise.all(screenshotPromises);
  }

  async getProjects(): Promise<VercelProjectType[]> {
    const response = await fetch('https://api.vercel.com/v9/projects', {
      headers: {
        Authorization: 'Bearer ' + process.env.VERCEL_API_TOKEN,
      },
      method: 'get',
    }).then((response) => {
      return response;
    });

    if (response.ok) {
      const data = (await response.json()) as {
        projects: VercelProjectType[];
        pagination: any;
      };

      return data.projects;
    } else {
      throw new Error('Failed to fetch projects');
    }
  }

  async buildProject(name: string): Promise<VercelProjectType> {
    const response = await fetch('https://api.vercel.com/v9/projects', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + process.env.VERCEL_API_TOKEN,
      },
      method: 'post',
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      throw new Error('Failed to build project');
    }

    return await response.json();
  }
}
