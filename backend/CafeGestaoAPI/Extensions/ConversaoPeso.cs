using System.Globalization;
using CafeGestaoAPI.Models.Enums;

namespace CafeGestaoAPI.Extensions
{
    public static class ConversaoPeso
    {
        private static readonly CultureInfo PtBr = new("pt-BR");

        public const decimal QuilogramasPorTonelada = 1000m;

        public static decimal ParaQuilogramas(decimal quantidade, UnidadePeso unidade) =>
            unidade == UnidadePeso.Tonelada ? quantidade * QuilogramasPorTonelada : quantidade;

        public static string FormatarQuilogramas(decimal quilogramas) =>
            $"{quilogramas.ToString("#,##0.###", PtBr)} kg";
    }
}
