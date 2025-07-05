
import { VendedorDataService } from './vendedores/VendedorDataService';
import { VendedorPhotoUploadService } from './vendedores/VendedorPhotoUploadService';
import { VendedorPhotoRemovalService } from './vendedores/VendedorPhotoRemovalService';
import { VendedorProfileUpdateService } from './vendedores/VendedorProfileUpdateService';
import { VendedorCadastroService } from './vendedores/VendedorCadastroService';

export interface Vendedor {
  id: string;
  name: string;
  email: string;
  photo_url?: string;
  user_type: string;
  created_at: string;
}

export class VendedoresService {
  static async fetchVendedores(): Promise<Vendedor[]> {
    return VendedorDataService.fetchVendedores();
  }

  static async updateVendedorPhoto(vendedorId: string, photoUrl: string): Promise<void> {
    return VendedorProfileUpdateService.updateVendedorPhoto(vendedorId, photoUrl);
  }

  static async uploadVendedorPhoto(vendedorId: string, file: File): Promise<string> {
    return VendedorPhotoUploadService.uploadVendedorPhoto(vendedorId, file);
  }

  static async removeVendedorPhoto(vendedorId: string): Promise<void> {
    return VendedorPhotoRemovalService.removeVendedorPhoto(vendedorId);
  }

  static async cadastrarVendedor(email: string, password: string, name: string): Promise<void> {
    return VendedorCadastroService.cadastrarVendedor(email, password, name);
  }
}
