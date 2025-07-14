
export type UserType = 'admin' | 'secretaria' | 'vendedor' | 'diretor' | 'sdr' | 'sdr_inbound' | 'sdr_outbound';

export interface User {
  id: string;
  name: string;
  email: string;
  user_type: UserType;
}
