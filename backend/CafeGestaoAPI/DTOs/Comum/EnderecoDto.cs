using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace CafeGestaoAPI.DTOs.Comum
{
    public class EnderecoDto
    {
        [Required(ErrorMessage = "A rua é obrigatória.")]
        [MaxLength(150, ErrorMessage = "A rua deve conter no máximo 150 caracteres.")]
        public string Rua { get; set; } = string.Empty;

        [Required(ErrorMessage = "O número é obrigatório. (use s/n se não houver)")]
        [MaxLength(10, ErrorMessage = "O número deve conter no máximo 10 caracteres.")]
        public string Numero { get; set; } = string.Empty;

        [Required(ErrorMessage = "O CEP é obrigatório.")]
        [RegularExpression(@"^\d{5}-\d{3}$", ErrorMessage = "Informe o CEP no formato 00000-000.")]
        public string Cep { get; set; } = string.Empty;

        [Required(ErrorMessage = "O bairro é obrigatório.")]
        [MaxLength(50, ErrorMessage = "O bairro deve ter no máximo 50 caracteres.")]
        public string Bairro { get; set; } = string.Empty;

        [Required(ErrorMessage = "A cidade é obrigatória.")]
        [MaxLength(100, ErrorMessage = "A cidade deve ter no máximo 100 caracteres.")]
        public string Cidade { get; set; } = string.Empty;

        [Required(ErrorMessage = "A UF é obrigatória.")]
        [RegularExpression(
            "^(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)$",
            ErrorMessage = "Informe uma UF válida (ex.: RO).")]
        public string Uf { get; set; } = string.Empty;

        [DefaultValue("Brasil")]
        [MaxLength(50, ErrorMessage = "O país deve ter no máximo 50 caracteres.")]
        public string? Pais { get; set; }

        [DefaultValue(null)]
        [MaxLength(100, ErrorMessage = "O complemento deve ter no máximo 100 caracteres.")]
        public string? Complemento { get; set; }
    }
}