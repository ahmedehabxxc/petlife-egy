using Supabase;
using petLifeApp.Services;
using petLifeApp.Services.Interfaces;

namespace petLifeApp
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // --- 1. REGISTER SERVICES ---
            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            // Supabase Configuration
            var supabaseUrl = builder.Configuration["Supabase:Url"];
            var supabaseKey = builder.Configuration["Supabase:AnonKey"];

            if (string.IsNullOrEmpty(supabaseUrl) || string.IsNullOrEmpty(supabaseKey))
            {
                throw new Exception("Supabase Url and AnonKey must be configured in appsettings.json.");
            }

            // Register Supabase Client
            builder.Services.AddScoped(_ => new Supabase.Client(supabaseUrl, supabaseKey));

            // Register your custom Shop Product Service (Plural version)
            // This links the Interface to the actual Implementation
            builder.Services.AddScoped<IShopProductServices, ShopProductServices>();

            // CORS (only needed when frontend is served from a different origin, e.g. Vite dev server)
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowFrontend", policy =>
                    policy.WithOrigins(
                            "http://localhost:8080",
                            "http://127.0.0.1:8080",
                            "http://localhost:5173",
                            "http://127.0.0.1:5173")
                        .AllowAnyMethod()
                        .AllowAnyHeader());
            });

            // --- 2. BUILD THE APP ---
            var app = builder.Build();

            // --- 3. CONFIGURE MIDDLEWARE ---
            
            // Serve built frontend (wwwroot). In dev you'll usually run Vite separately.
            app.UseDefaultFiles();
            app.UseStaticFiles();

            // Swagger at /swagger (keeps "/" for the frontend)
            app.UseSwagger();
            app.UseSwaggerUI(c =>
            {
                c.SwaggerEndpoint("/swagger/v1/swagger.json", "PetLife API V1");
                c.RoutePrefix = "swagger";
            });

            app.UseHttpsRedirection();
            app.UseCors("AllowFrontend");
            app.UseAuthorization();
            app.MapControllers();
            app.MapFallbackToFile("index.html");
            app.Run();
        }
    }
}