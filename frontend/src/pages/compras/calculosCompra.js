export function calcularSubtotal(quantidade, valorUnitario) {
  if (!quantidade || valorUnitario === null || valorUnitario === undefined) return 0;
  return Math.round(quantidade * valorUnitario * 100) / 100;
}

export function calcularTotal(itens) {
  return (itens ?? []).reduce((total, item) => total + calcularSubtotal(item?.quantidade, item?.valorUnitario), 0);
}
