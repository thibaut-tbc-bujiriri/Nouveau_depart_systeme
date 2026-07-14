export const formatCurrency = (amount: number) => {
  const activeCurrency = localStorage.getItem('ecnd.pref_currency') || 'USD';
  const exchangeRate = Number(localStorage.getItem('ecnd.pref_exchange_rate') || '2500');

  if (activeCurrency === 'USD') {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  const cdfAmount = Math.round(amount * exchangeRate);
  return `${cdfAmount.toLocaleString('fr-FR')} CDF`;
};

export const parseSafeDate = (date?: string | Date | null) => {
  if (!date) return null;
  const parsed = date instanceof Date ? date : new Date(date);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatDate = (date?: string | Date | null, fallback = 'Non renseigné') => {
  const parsed = parseSafeDate(date);
  if (!parsed) return fallback;

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
};
