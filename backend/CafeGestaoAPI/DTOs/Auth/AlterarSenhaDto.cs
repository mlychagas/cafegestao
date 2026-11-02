using System.ComponentModel.DataAnnotations;

namespace CafeGestaoAPI.DTOs.Auth
{
    public class AlterarSenhaDto : IValidatableObject
    {
        [Required(ErrorMessage = "A senha atual é obrigatória.")]
        public string SenhaAtual { get; set; } = string.Empty;

        [Required(ErrorMessage = "A senha é obrigatória.")]
        [MinLength(8, ErrorMessage = "A senha deve conter no mínimo 8 caracteres.")]
        [MaxLength(100, ErrorMessage = "A senha deve conter no máximo 100 caracteres.")]
        [RegularExpression(@"^(?=.*[A-Za-z])(?=.*\d).+$", ErrorMessage = "A senha deve conter pelo menos 8 caracteres, incluindo letras e números.")]
        public string NovaSenha { get; set; } = string.Empty;

        [Compare(nameof(NovaSenha), ErrorMessage = "As senhas não conferem.")]
        public string ConfirmarNovaSenha { get; set; } = string.Empty;

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (NovaSenha == SenhaAtual)
            {
                yield return new ValidationResult("A nova senha não pode ser igual à senha atual.", new[] { nameof(NovaSenha) });
            }
        }

    }
}
