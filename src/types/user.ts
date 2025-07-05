
export type UserType = 'admin' | 'secretaria' | 'vendedor';

export interface User {
  id: string;
  name: string;
  email: string;
  user_type: UserType;
}
