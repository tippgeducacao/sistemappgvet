
export type UserType = 'admin' | 'secretaria' | 'vendedor' | 'diretor' | 'sdr_inbound' | 'sdr_outbound' | 'sdr';

export interface User {
  id: string;
  name: string;
  email: string;
  user_type: UserType;
}
