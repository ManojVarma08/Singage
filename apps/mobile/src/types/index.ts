export type { TV, Layout, MediaCell, TVState, UploadResult } from '../../../../packages/shared/src/types';

export type RootStackParamList = {
  Home: undefined;
  Scanner: undefined;
  TVDetail: { tv: import('../../../../packages/shared/src/types').TV };
  Layout: { tv: import('../../../../packages/shared/src/types').TV };
  Media: {
    tv: import('../../../../packages/shared/src/types').TV;
    layoutId: string;
    cellCount: number;
  };
};
