using CafeGestaoAPI.Configuracoes;
using CafeGestaoAPI.Data;
using CafeGestaoAPI.Models.Entities;
using CafeGestaoAPI.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using CafeGestaoAPI.Filtros;


var MyAllowSpecificOrigins = "PermitirFrontend";

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
                      policy =>
                      {
                          policy.WithOrigins("http://localhost:5173")
                                .AllowAnyHeader()
                                .AllowAnyMethod();
                      });
});

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, new MySqlServerVersion(new Version(8, 0))));

// Add services to the container.
builder.Services.AddScoped<IPasswordHasher<Usuario>, PasswordHasher<Usuario>>();

builder.Services.AddScoped<ITokenService, TokenService>();

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    c.SchemaFilter<ExemploNuloSchemaFilter>();
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Faça o login, copie o token e cole aqui. "
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
      {
        new OpenApiSecurityScheme
        {
            Reference = new OpenApiReference
            {
                Type = ReferenceType.SecurityScheme,
                Id = "Bearer"
            },

        },
          Array.Empty<string>()
      }

    });
});

builder.Services.Configure<JwtConfiguracoes>(builder.Configuration.GetSection("Jwt"));

var jwtConfiguracoes = builder.Configuration.GetSection("Jwt").Get<JwtConfiguracoes>()!;

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
{
    options.MapInboundClaims = false;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = jwtConfiguracoes.Emissor,
        ValidateAudience = true,
        ValidAudience = jwtConfiguracoes.Publico,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Convert.FromBase64String(jwtConfiguracoes.Chave)),
        ClockSkew = TimeSpan.FromMinutes(1)
    };
    options.Events = new JwtBearerEvents
    {

        OnTokenValidated = async context =>
        {
            var id = context.Principal?.FindFirst("sub")?.Value;
            var versaoToken = context.Principal?.FindFirst("versao_token")?.Value;

            var dbContexto = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();

            if (!int.TryParse(id, out var usuarioId))
            {
                context.Fail("Token inválido.");
                return;
            }

            var usuario = await dbContexto.Usuarios.FindAsync(usuarioId);

            if (usuario is null || !usuario.Ativo || versaoToken != usuario.VersaoToken.ToString())
            {
                context.Fail("Token inválido.");
            }

        }
    };


});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseRouting();

app.UseCors(MyAllowSpecificOrigins);

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();
