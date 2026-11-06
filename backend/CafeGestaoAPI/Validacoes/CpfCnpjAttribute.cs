using System.ComponentModel.DataAnnotations;

namespace CafeGestaoAPI.Validacoes
{
    [AttributeUsage(AttributeTargets.Property)]
    public class CpfCnpjAttribute : ValidationAttribute
    {
        public CpfCnpjAttribute()
            : base("Informe um CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00) válido.")
        {
        }

        public override bool IsValid(object? value)
        {
            if (value is not string documento || string.IsNullOrWhiteSpace(documento))
            {
                return true;
            }

            return DocumentoValidador.CpfOuCnpjValido(documento.Trim().ToUpperInvariant());
        }
    }
}
