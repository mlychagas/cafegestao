using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using CafeGestaoAPI.DTOs.Comum;
using CafeGestaoAPI.Validacoes;

namespace CafeGestaoAPI.DTOs.Clientes
{
    public class ClienteSalvarDto
    {
        [Required(ErrorMessage = "O nome do cliente é obrigatório.")]
        [MaxLength(150, ErrorMessage = "O nome deve ter no máximo 150 caracteres.")]
        public string Nome { get; set; } = string.Empty;

        [Required(ErrorMessage = "O CPF ou CNPJ é obrigatório.")]
        [MaxLength(20, ErrorMessage = "O CPF ou CNPJ deve ter no máximo 20 caracteres.")]
        [CpfCnpj]
        public string CpfCnpj { get; set; } = string.Empty;

        [Required(ErrorMessage = "O telefone é obrigatório.")]
        [RegularExpression(@"^\(\d{2}\) \d{4,5}-\d{4}$", ErrorMessage = "Informe o telefone no formato (00) 0000-0000 ou (00) 00000-0000.")]
        public string Telefone { get; set; } = string.Empty;

        [DefaultValue(null)]
        [RegularExpression(@"^\(\d{2}\) \d{5}-\d{4}$", ErrorMessage = "Informe o celular no formato (00) 00000-0000.")]
        public string? Celular { get; set; }

        [Required(ErrorMessage = "O e-mail é obrigatório.")]
        [MaxLength(100, ErrorMessage = "O e-mail deve ter no máximo 100 caracteres.")]
        [RegularExpression(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", ErrorMessage = "Informe um e-mail válido.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "O endereço é obrigatório.")]
        public EnderecoDto? Endereco { get; set; }
    }
}
