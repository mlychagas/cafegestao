import { REGEX_CNPJ, REGEX_CPF } from './mascaras.js';

const PESOS_CNPJ_DV1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_CNPJ_DV2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

function somenteCaracteres(documento) {
  return documento.replace(/[^0-9A-Z]/g, '');
}

function todosIguais(texto) {
  return [...texto].every((caractere) => caractere === texto[0]);
}

function digitoModulo11(soma) {
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

function calcularDvCpf(base, pesoInicial) {
  const soma = [...base].reduce((total, caractere, i) => total + Number(caractere) * (pesoInicial - i), 0);
  return digitoModulo11(soma);
}

function calcularDvCnpj(base, pesos) {
  const soma = [...base].reduce((total, caractere, i) => total + (caractere.charCodeAt(0) - 48) * pesos[i], 0);
  return digitoModulo11(soma);
}

export function validarCpf(cpf) {
  if (!REGEX_CPF.test(cpf)) return false;

  const digitos = somenteCaracteres(cpf);
  if (todosIguais(digitos)) return false;

  const dv1 = calcularDvCpf(digitos.slice(0, 9), 10);
  const dv2 = calcularDvCpf(digitos.slice(0, 9) + dv1, 11);

  return digitos.slice(9) === `${dv1}${dv2}`;
}

export function validarCnpj(cnpj) {
  if (!REGEX_CNPJ.test(cnpj)) return false;

  const caracteres = somenteCaracteres(cnpj);
  if (todosIguais(caracteres)) return false;

  const dv1 = calcularDvCnpj(caracteres.slice(0, 12), PESOS_CNPJ_DV1);
  const dv2 = calcularDvCnpj(caracteres.slice(0, 12) + dv1, PESOS_CNPJ_DV2);

  return caracteres.slice(12) === `${dv1}${dv2}`;
}

export function validarCpfCnpj(documento) {
  const valor = (documento ?? '').trim().toUpperCase();
  return validarCpf(valor) || validarCnpj(valor);
}

export function tipoDocumento(documento) {
  return REGEX_CPF.test(documento ?? '') ? 'CPF' : 'CNPJ';
}
