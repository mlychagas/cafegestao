using System.ComponentModel.DataAnnotations;
using System.Reflection;
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace CafeGestaoAPI.Filtros
{
    public class ExemploNuloSchemaFilter : ISchemaFilter
    {
        public void Apply(OpenApiSchema schema, SchemaFilterContext context)
        {
            if (schema.Properties is null || schema.Properties.Count == 0)
            {
                return;
            }

            var propriedades = context.Type.GetProperties(BindingFlags.Public | BindingFlags.Instance);

            foreach (var propriedade in propriedades)
            {
                var anulavel = Nullable.GetUnderlyingType(propriedade.PropertyType) is not null;
                var obrigatoria = propriedade.GetCustomAttribute<RequiredAttribute>() is not null;

                if (!anulavel || obrigatoria)
                {
                    continue;
                }

                var chave = schema.Properties.Keys.FirstOrDefault(
                    k => string.Equals(k, propriedade.Name, StringComparison.OrdinalIgnoreCase));

                if (chave is not null)
                {
                    schema.Properties[chave].Example = new OpenApiNull();
                }
            }
        }
    }
}