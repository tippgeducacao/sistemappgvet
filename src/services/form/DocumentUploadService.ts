
import { supabase } from '@/integrations/supabase/client';

export class DocumentUploadService {
  static async uploadDocument(file: File, vendedorId: string, formEntryId: string): Promise<string> {
    try {
      console.log('📎 ========== INICIANDO UPLOAD DE DOCUMENTO ==========');
      console.log('📄 Dados do arquivo:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        vendedorId,
        formEntryId
      });

      // Criar nome único para o arquivo
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${vendedorId}/${formEntryId}/${timestamp}-${file.name}`;
      console.log('📝 Nome do arquivo gerado:', fileName);

      // Upload do arquivo para o Supabase Storage
      console.log('⬆️ Iniciando upload para o Supabase Storage...');
      const { data, error } = await supabase.storage
        .from('documentos-vendas')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ Erro detalhado no upload:', {
          message: error.message,
          error: error
        });
        throw new Error(`Falha no upload do documento: ${error.message}`);
      }

      if (!data || !data.path) {
        console.error('❌ Upload retornou sem dados válidos:', data);
        throw new Error('Upload falhou - nenhum caminho retornado');
      }

      console.log('✅ Documento enviado com sucesso!');
      console.log('📍 Caminho do arquivo:', data.path);

      // Salvar IMEDIATAMENTE o caminho do documento na form_entry
      console.log('💾 Salvando caminho do documento na form_entry...');
      const { error: updateError } = await supabase
        .from('form_entries')
        .update({ documento_comprobatorio: data.path })
        .eq('id', formEntryId);

      if (updateError) {
        console.error('❌ Erro ao salvar caminho do documento:', updateError);
        // Tentar deletar o arquivo que foi enviado se falhar o salvamento
        await supabase.storage.from('documentos-vendas').remove([data.path]);
        throw new Error(`Falha ao salvar referência do documento: ${updateError.message}`);
      }

      console.log('📎 ========== UPLOAD CONCLUÍDO COM SUCESSO ==========');
      return data.path;

    } catch (error) {
      console.error('💥 ========== ERRO CRÍTICO NO UPLOAD ==========');
      console.error('💥 Detalhes do erro:', error);
      console.error('💥 Stack trace:', error instanceof Error ? error.stack : 'N/A');
      throw error;
    }
  }

  // NOVA FUNÇÃO: Usar SQL para encontrar documento por venda ID
  static async findDocumentByVendaId(vendaId: string): Promise<string | null> {
    try {
      console.log('🔍 Usando SQL para buscar documento da venda:', vendaId);
      
      const { data, error } = await supabase.rpc('find_document_by_venda_id', {
        venda_id_param: vendaId
      });

      if (error) {
        console.error('❌ Erro na função SQL:', error);
        return null;
      }

      console.log('📄 Documento encontrado via SQL:', data);
      return data;
    } catch (error) {
      console.error('💥 Erro ao buscar via SQL:', error);
      return null;
    }
  }

  // NOVA FUNÇÃO: Listar arquivos usando SQL
  static async listBucketFiles(bucketName: string = 'documentos-vendas', folderPrefix: string = ''): Promise<any[]> {
    try {
      console.log('📋 Listando arquivos via SQL:', { bucketName, folderPrefix });
      
      const { data, error } = await supabase.rpc('list_bucket_files', {
        bucket_name: bucketName,
        folder_prefix: folderPrefix
      });

      if (error) {
        console.error('❌ Erro ao listar via SQL:', error);
        return [];
      }

      console.log('📁 Arquivos encontrados via SQL:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('💥 Erro ao listar arquivos:', error);
      return [];
    }
  }

  static async listAllFilesInBucket(): Promise<any[]> {
    return this.listBucketFiles();
  }

  static async findFileByPattern(searchPattern: string): Promise<string | null> {
    try {
      console.log('🔍 Procurando arquivo via SQL com padrão:', searchPattern);
      
      const { data, error } = await supabase.rpc('find_document_in_bucket', {
        search_pattern: searchPattern
      });

      if (error) {
        console.error('❌ Erro na busca via SQL:', error);
        return null;
      }

      console.log('✅ Arquivo encontrado via SQL:', data);
      return data;
    } catch (error) {
      console.error('💥 Erro na busca por padrão:', error);
      return null;
    }
  }

  static async getDocumentUrl(filePath: string, vendaId?: string): Promise<string> {
    console.log('🔗 ========== OBTENDO URL DO DOCUMENTO ==========');
    console.log('📁 Caminho original:', filePath);
    console.log('🆔 Venda ID:', vendaId);
    
    try {
      let finalPath = filePath;

      // ESTRATÉGIA 1: Se o caminho for inválido, usar SQL para encontrar o arquivo real
      if (!filePath || filePath === 'null' || filePath.includes('temp-') || filePath.includes('undefined')) {
        console.log('⚠️ Caminho inválido detectado, buscando via SQL...');
        
        if (vendaId) {
          const realPath = await this.findDocumentByVendaId(vendaId);
          if (realPath) {
            finalPath = realPath;
            console.log('✅ Caminho corrigido via SQL:', finalPath);
          }
        }
      }

      // ESTRATÉGIA 2: Verificar se o arquivo existe no storage
      if (!finalPath || finalPath === filePath) {
        console.log('🔄 Verificando existência do arquivo...');
        
        const { data: listData, error: listError } = await supabase.storage
          .from('documentos-vendas')
          .list('', { limit: 1000 });

        if (!listError && listData) {
          const foundFile = listData.find(file => 
            file.name.includes(vendaId?.substring(0, 8) || '')
          );
          
          if (foundFile) {
            finalPath = foundFile.name;
            console.log('✅ Arquivo encontrado na listagem:', finalPath);
          }
        }
      }

      // Validação final
      if (!finalPath || finalPath === 'null') {
        throw new Error('Documento não encontrado no storage');
      }

      // Limpar o caminho final
      const cleanPath = finalPath.replace(/\/+/g, '/').replace(/^\//, '');
      console.log('🧹 Caminho final limpo:', cleanPath);

      // Gerar URL pública
      const { data: publicUrlData } = supabase.storage
        .from('documentos-vendas')
        .getPublicUrl(cleanPath);

      if (!publicUrlData?.publicUrl) {
        throw new Error('Falha ao gerar URL pública');
      }

      console.log('🌐 URL pública gerada:', publicUrlData.publicUrl);
      
      return publicUrlData.publicUrl;

    } catch (error) {
      console.error('💥 ERRO ao obter URL do documento:', error);
      console.error('💥 Caminho original:', filePath);
      
      throw new Error(`Não foi possível acessar o documento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async deleteDocument(filePath: string): Promise<void> {
    try {
      console.log('🗑️ Deletando documento:', filePath);
      
      const { error } = await supabase.storage
        .from('documentos-vendas')
        .remove([filePath]);

      if (error) {
        console.error('❌ Erro ao deletar documento:', error);
        throw error;
      }

      console.log('✅ Documento deletado com sucesso:', filePath);
    } catch (error) {
      console.error('💥 Erro ao deletar documento:', error);
      throw error;
    }
  }
}
