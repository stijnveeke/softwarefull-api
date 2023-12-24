/* eslint-disable prettier/prettier */
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { list, put } from '@vercel/blob';
import puppeteer, { KnownDevices } from 'puppeteer';
import { BrowserSize } from 'src/enums/browserSize';
import { Cache } from 'cache-manager';

@Injectable()
export class ImageService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}
  // Logic for taking and saving screenshots
  async takeScreenshot(
    projectId: string,
    websiteUrl: string,
    deviceType: BrowserSize = BrowserSize.Desktop,
    darkMode: boolean = false,
  ): Promise<Blob> {
    // TODO check for screenshot?
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    let dtype: string = '';

    await page.goto(websiteUrl);
    switch (deviceType) {
      case BrowserSize.Desktop:
        dtype = 'desktop';
        await page.setViewport({ width: 1920, height: 1080 });
        break;
      case BrowserSize.Tablet:
        dtype = 'tablet';
        await page.emulate(KnownDevices[BrowserSize.Tablet]);
        break;
      case BrowserSize.Mobile:
        dtype = 'mobile';
        await page.emulate(KnownDevices[BrowserSize.Mobile]);
        break;
    }

    if (darkMode) {
      await page.emulateMediaFeatures([
        { name: 'prefers-color-scheme', value: 'dark' },
      ]);
    }

    const image = await page.screenshot({ type: 'png', encoding: 'binary' });
    await browser.close();
    const blob = new Blob([image]);

    console.log(projectId, dtype, darkMode);

    // Perform screenshot
    await put(
      `screenshots/${projectId}/${darkMode ? 'dark' : 'light'}/${dtype}.png`,
      blob,
      {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      },
    );

    return blob;
  }

  async takeScreenshotsOfProject(
    projectId: string,
    websiteUrl: string,
  ): Promise<{
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
  }> {
    // Take desktop screenshot
    const desktopLight = this.takeScreenshot(
      projectId,
      websiteUrl,
      BrowserSize.Desktop,
      false,
    );

    const desktopDark = this.takeScreenshot(
      projectId,
      websiteUrl,
      BrowserSize.Desktop,
      true,
    );

    // Take tablet screenshot
    const tabletLight = this.takeScreenshot(
      projectId,
      websiteUrl,
      BrowserSize.Tablet,
      false,
    );

    const tabletDark = this.takeScreenshot(
      projectId,
      websiteUrl,
      BrowserSize.Tablet,
      true,
    );

    // Take mobile screenshot
    const mobileLight = this.takeScreenshot(
      projectId,
      websiteUrl,
      BrowserSize.Mobile,
      false,
    );

    const mobileDark = this.takeScreenshot(
      projectId,
      websiteUrl,
      BrowserSize.Mobile,
      true,
    );

    const dark = {
      desktop: await desktopDark,
      tablet: await tabletDark,
      mobile: await mobileDark,
    };

    const light = {
      desktop: await desktopLight,
      tablet: await tabletLight,
      mobile: await mobileLight,
    };

    return { dark, light };
  }

  async getScreenshots(projectId: string): Promise<{
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
  }> {
    const result = await list({
      mode: 'expanded',
      prefix: `screenshots/${projectId}/`,
    });

    if (result.blobs.length === 0) {
      return {
        dark: {},
        light: {},
      };
    }

    const cachedBase64Images = (await this.cacheManager.get(
      `project-screenshots-${projectId}`,
    )) as {
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
    } | null;

    console.log('Checking for cached screenshots');
    if (cachedBase64Images !== undefined && cachedBase64Images !== null) {
      return cachedBase64Images;
    }

    console.log('Screenshots not cached, fetching from blob storage');
    const promisedBase64Images: Record<string, Promise<string>> = {};

    for (const blob of result.blobs) {
      await fetch(blob.url).then(async (response) => {
        promisedBase64Images[blob.pathname] = new Promise(async (resolve) => {
          const base64 = await this.convertBlobToBase64(await response.blob());
          resolve(base64);
        });
      });
    }

    const base64Images = {
      dark: {
        desktop:
          await promisedBase64Images[
            'screenshots/' + projectId + '/dark/desktop.png'
          ],
        tablet:
          await promisedBase64Images[
            'screenshots/' + projectId + '/dark/tablet.png'
          ],
        mobile:
          await promisedBase64Images[
            'screenshots/' + projectId + '/dark/mobile.png'
          ],
      },
      light: {
        desktop:
          await promisedBase64Images[
            'screenshots/' + projectId + '/light/desktop.png'
          ],
        tablet:
          await promisedBase64Images[
            'screenshots/' + projectId + '/light/tablet.png'
          ],
        mobile:
          await promisedBase64Images[
            'screenshots/' + projectId + '/light/mobile.png'
          ],
      },
    };

    await this.cacheManager
      .set(`project-screenshots-${projectId}`, base64Images, 0)
      .then(() => {
        console.log('Screenshots cached');
      });

    return base64Images;
  }

  async convertBlobToBase64(image: Blob): Promise<string> {
    const arrayBuffer = await image.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return base64;
  }

  // Logic for saving user images as a galery
  // async getImage(projectId: string): Promise<Blob> {

  // }
  // async createImage(projectId: string): Promise<string> {
  //   const result = await put(
  //     `screenshots/${projectId}/desktop.png`,
  //     'Hello World!',
  //   );
  //   return 'Hello World!';
  // }
  updateImage(): string {
    return 'Hello World!';
  }
  deleteImage(): string {
    return 'Hello World!';
  }
}
