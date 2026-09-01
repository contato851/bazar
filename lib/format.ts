export function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Código curto do pedido pra exibir/citar no WhatsApp — não é o UUID inteiro. */
export function shortOrderCode(id: string) {
  return `#${id.slice(0, 4).toUpperCase()}`;
}
