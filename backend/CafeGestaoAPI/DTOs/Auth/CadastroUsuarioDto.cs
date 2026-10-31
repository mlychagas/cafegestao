using System.ComponentModel.DataAnnotations;

namespace CafeGestaoAPI.DTOs.Auth
{
    public class CadastroUsuarioDto : IValidatableObject
    {
        [Required(ErrorMessage = "O nome é obrigatório.")]
        [MaxLength(100, ErrorMessage = "O nome deve ter no máximo 100 caracteres.")]
        public string Nome { get; set; } = string.Empty;

        [Required(ErrorMessage = "Data de nascimento é obrigatória.")]
        public DateOnly? DataNascimento { get; set; }

        [Required(ErrorMessage = "O e-mail é obrigatório.")]
        [EmailAddress(ErrorMessage = "Informe um e-mail válido.")]
        [RegularExpression(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", ErrorMessage = "Informe um e-mail válido.")]
        [MaxLength(150, ErrorMessage = "O e-mail deve ter no máximo 150 caracteres.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "A senha é obrigatória.")]
        [MinLength(8, ErrorMessage = "A senha dever conter no mínimo 8 caracteres.")]
        [MaxLength(100, ErrorMessage = "A senha dever conter no máximo 100 caracteres.")]
        [RegularExpression(@"^(?=.*[A-Za-z])(?=.*\d).+$", ErrorMessage = "A senha deve conter pelo menos 8 caracteres, incluindo letras e números.")]
        public string Senha { get; set; } = string.Empty;

        [Compare(nameof(Senha), ErrorMessage = "As senhas não conferem.")]
        public string ConfirmarSenha { get; set; } = string.Empty;

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            var dataAtual = DateOnly.FromDateTime(DateTime.Today);

            if (DataNascimento > dataAtual)
            {
                yield return new ValidationResult("A data não pode ser futura.", new[] { nameof(DataNascimento) });
            }

        }
    }
}
