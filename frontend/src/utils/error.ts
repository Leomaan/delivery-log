const EXACT_MESSAGE_TRANSLATIONS: Record<string, string> = {
  'Invalid email or password': 'E-mail ou senha incorretos.',
  'Refresh token is required': 'Sua sessão expirou. Faça login novamente.',
  'Invalid or expired refresh token': 'Sua sessão expirou. Faça login novamente.',
  'Invalid or expired access token': 'Sua sessão expirou. Faça login novamente.',
  'Place not found': 'Destino não encontrado.',
  'Place with this name already exists': 'Já existe um destino cadastrado com este nome.',
  'Delivery not found': 'Registro de entrega não encontrado.',
  'Cannot register delivery for an inactive place':
    'Não é possível registrar entregas para um destino inativo.',
  'No active price found for this place on the specified delivery date':
    'Nenhum valor vigente encontrado para este destino na data selecionada.',
  'No active price found for this place on the specified date':
    'Nenhum valor vigente encontrado para este destino nesta data.',
  'validTo cannot be earlier than validFrom':
    'A data final de vigência não pode ser anterior à data inicial.',
  'to date cannot be earlier than from date': 'A data final não pode ser anterior à data inicial.',
  'quantity must be a positive integer': 'A quantidade deve ser um número inteiro maior que zero.',
  'Price validity interval overlaps with an existing price':
    'O período de vigência informado conflita com outro valor já cadastrado.',
  'Too many requests, please try again later':
    'Muitas requisições em sequência. Aguarde alguns segundos e tente novamente.',
  'Invalid request payload': 'Os dados enviados são inválidos. Verifique os campos preenchidos.',
  'Validation failed': 'Falha na validação dos dados informados.',
  'Route not found': 'Rota não encontrada no servidor.',
  'An unexpected error occurred': 'Ocorreu um erro inesperado no servidor. Tente novamente.',
};

const KNOWN_PT_MESSAGES = new Set(Object.values(EXACT_MESSAGE_TRANSLATIONS));

const STATUS_FALLBACK_MESSAGES: Record<number, string> = {
  400: 'Dados inválidos. Verifique as informações preenchidas.',
  401: 'E-mail ou senha incorretos.',
  403: 'Você não tem permissão para realizar esta ação.',
  404: 'Registro não encontrado.',
  409: 'Conflito: este registro já existe ou conflita com outro cadastro.',
  429: 'Muitas tentativas seguidas. Aguarde um instante e tente novamente.',
  500: 'Erro interno no servidor. Tente novamente em instantes.',
};

export function translateApiErrorMessage(rawMessage?: string, statusCode?: number): string {
  if (rawMessage) {
    const trimmed = rawMessage.trim();

    if (KNOWN_PT_MESSAGES.has(trimmed)) {
      return trimmed;
    }

    if (EXACT_MESSAGE_TRANSLATIONS[trimmed]) {
      return EXACT_MESSAGE_TRANSLATIONS[trimmed];
    }

    if (trimmed.includes('Invalid email or password')) {
      return 'E-mail ou senha incorretos.';
    }
    if (trimmed.includes('No active price found')) {
      return 'Nenhum valor vigente encontrado para este destino na data informada.';
    }
    if (trimmed.includes('must be a positive integer')) {
      return 'O valor informado deve ser um número inteiro maior que zero.';
    }
    if (
      trimmed.includes('must be in YYYY-MM-DD format') ||
      trimmed.includes('Invalid calendar date')
    ) {
      return 'Data inválida. Selecione uma data válida no calendário.';
    }
    if (trimmed.startsWith('email:')) {
      return 'Informe um endereço de e-mail válido.';
    }
    if (trimmed.startsWith('password:')) {
      return 'A senha deve ter pelo menos 8 caracteres.';
    }
    if (trimmed.startsWith('name:')) {
      return 'O nome do destino deve ter pelo menos 2 caracteres.';
    }
    if (trimmed.startsWith('quantity:')) {
      return 'A quantidade deve ser de pelo menos 1 quentinha.';
    }
    if (trimmed.startsWith('unitCents:')) {
      return 'Informe um valor unitário válido maior que zero.';
    }
  }

  if (statusCode && STATUS_FALLBACK_MESSAGES[statusCode]) {
    return STATUS_FALLBACK_MESSAGES[statusCode];
  }

  if (rawMessage && rawMessage.trim().length > 0) {
    return rawMessage.trim();
  }

  return 'Não foi possível concluir a operação. Tente novamente.';
}

export function formatErrorToPtBr(err: unknown, fallback = 'Ocorreu um erro inesperado.'): string {
  if (err instanceof Error && err.message) {
    if (err.message === 'Failed to fetch' || err.message.includes('NetworkError')) {
      return 'Sem conexão com o servidor. Verifique se o sistema está rodando.';
    }
    return translateApiErrorMessage(err.message);
  }
  return fallback;
}
