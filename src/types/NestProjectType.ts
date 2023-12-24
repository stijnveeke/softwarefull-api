/* eslint-disable prettier/prettier */
export type NestProjectType = {
  id: string;
  name: string;
  websiteUrl: string;
  images: {
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
  };
};
