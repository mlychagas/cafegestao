using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using CafeGestaoAPI.Validacoes;

namespace CafeGestaoAPI.DTOs.Pessoas
{
    public class PessoaSalvarDto : IValidatableObject
    {
        public const int IdadeMinima = 15;

        [Required(ErrorMessage = "O nome da pessoa é obrigatório.")]
        [MaxLength(100, ErrorMessage = "O nome deve ter no máximo 100 caracteres.")]
        public string Nome { get; set; } = string.Empty;

        [Required(ErrorMessage = "O CPF é obrigatório.")]
        [RegularExpression(@"^\d{3}\.\d{3}\.\d{3}-\d{2}$", ErrorMessage = "Informe o CPF no formato 000.000.000-00.")]
        public string Cpf { get; set; } = string.Empty;

        [DefaultValue(null)]
        [RegularExpression(@"^\(\d{2}\) \d{4,5}-\d{4}$", ErrorMessage = "Informe o telefone no formato (00) 0000-0000 ou (00) 00000-0000.")]
        public string? Telefone { get; set; }

        [Required(ErrorMessage = "A data de nascimento é obrigatória.")]
        public DateOnly? DataNascimento { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (!string.IsNullOrWhiteSpace(Cpf) && !DocumentoValidador.CpfValido(Cpf))
            {
                yield return new ValidationResult("CPF inválido. Confira os números digitados.", new[] { nameof(Cpf) });
            }

            var dataLimite = DateOnly.FromDateTime(DateTime.Today).AddYears(-IdadeMinima);

            if (DataNascimento > dataLimite)
            {
                yield return new ValidationResult(
                    $"A pessoa deve ter pelo menos {IdadeMinima} anos.",
                    new[] { nameof(DataNascimento) });
            }
        }
    }
}
