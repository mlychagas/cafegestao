using System.Text.RegularExpressions;

namespace CafeGestaoAPI.Validacoes
{
    public static partial class DocumentoValidador
    {
        [GeneratedRegex(@"^\d{3}\.\d{3}\.\d{3}-\d{2}$")]
        private static partial Regex FormatoCpf();

        [GeneratedRegex(@"^[0-9A-Z]{2}\.[0-9A-Z]{3}\.[0-9A-Z]{3}/[0-9A-Z]{4}-\d{2}$")]
        private static partial Regex FormatoCnpj();

        private static readonly int[] PesosCnpjDv1 = { 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };

        private static readonly int[] PesosCnpjDv2 = { 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };

        public static bool CpfValido(string? cpf)
        {
            if (cpf is null || !FormatoCpf().IsMatch(cpf))
            {
                return false;
            }

            var digitos = SomenteCaracteres(cpf);

            if (digitos.Distinct().Count() == 1)
            {
                return false;
            }

            var dv1 = CalcularDvCpf(digitos[..9], pesoInicial: 10);
            var dv2 = CalcularDvCpf(digitos[..9] + dv1, pesoInicial: 11);

            return digitos[9] - '0' == dv1 && digitos[10] - '0' == dv2;
        }

        public static bool CnpjValido(string? cnpj)
        {
            if (cnpj is null || !FormatoCnpj().IsMatch(cnpj))
            {
                return false;
            }

            var caracteres = SomenteCaracteres(cnpj);

            if (caracteres.Distinct().Count() == 1)
            {
                return false;
            }

            var dv1 = CalcularDvCnpj(caracteres[..12], PesosCnpjDv1);
            var dv2 = CalcularDvCnpj(caracteres[..12] + dv1, PesosCnpjDv2);

            return caracteres[12] - '0' == dv1 && caracteres[13] - '0' == dv2;
        }

        public static bool CpfOuCnpjValido(string? documento) =>
            CpfValido(documento) || CnpjValido(documento);

        private static string SomenteCaracteres(string documento) =>
            new(documento.Where(char.IsLetterOrDigit).ToArray());

        private static int CalcularDvCpf(string baseCalculo, int pesoInicial)
        {
            var soma = 0;

            for (var i = 0; i < baseCalculo.Length; i++)
            {
                soma += (baseCalculo[i] - '0') * (pesoInicial - i);
            }

            var resto = soma % 11;
            return resto < 2 ? 0 : 11 - resto;
        }

        private static int CalcularDvCnpj(string baseCalculo, int[] pesos)
        {
            var soma = 0;

            for (var i = 0; i < baseCalculo.Length; i++)
            {
                soma += (baseCalculo[i] - 48) * pesos[i];
            }

            var resto = soma % 11;
            return resto < 2 ? 0 : 11 - resto;
        }
    }
}
