export function formatCentsToBRL(cents: number): string {
  const reais = cents / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(reais);
}

export function parseReaisInputToCents(input: string): number | null {
  const cleaned = input.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    return null;
  }

  const [intPart = '0', decPart = ''] = cleaned.split('.');
  const cents = Number.parseInt(intPart, 10) * 100 + Number.parseInt(decPart.padEnd(2, '0'), 10);

  return cents > 0 ? cents : null;
}
