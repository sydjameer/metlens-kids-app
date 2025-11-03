
export enum Language {
  Arabic = 'Arabic',
  Malay = 'Malay',
}

export enum AppMode {
  Home = 'home',
  Image = 'image',
  Video = 'video',
}

export interface DetectedObject {
  name: string;
  translation: string;
  pronunciation: string;
}
