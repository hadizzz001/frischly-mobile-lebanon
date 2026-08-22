import type { Dispatch, SetStateAction } from 'react';

export interface CartBoolContextValue {
  isBooleanValue: boolean;
  setBooleanValue: Dispatch<SetStateAction<boolean>>;
}
