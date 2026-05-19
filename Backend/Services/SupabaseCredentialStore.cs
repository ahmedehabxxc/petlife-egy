using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace petLifeApp.Services
{
    /// <summary>
    /// Persists vet credential bytes to Supabase bytea via PostgREST hex format (\\x...).
    /// The Supabase C# client's byte[] mapping does not reliably write bytea columns.
    /// </summary>
    public class SupabaseCredentialStore
    {
        private readonly IConfiguration _config;
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<SupabaseCredentialStore> _logger;

        public SupabaseCredentialStore(
            IConfiguration config,
            IWebHostEnvironment env,
            ILogger<SupabaseCredentialStore> logger)
        {
            _config = config;
            _env = env;
            _logger = logger;
        }

        public async Task SaveCredentialsAsync(
            Guid vetId,
            byte[] bytes,
            string fileName,
            string? contentType,
            CancellationToken cancellationToken = default)
        {
            if (bytes == null || bytes.Length == 0)
            {
                throw new ArgumentException("Credential file is empty.", nameof(bytes));
            }

            var supabaseUrl = _config["Supabase:Url"]?.TrimEnd('/');
            var serviceRoleKey = _config["Supabase:ServiceRoleKey"];
            if (string.IsNullOrWhiteSpace(supabaseUrl) || string.IsNullOrWhiteSpace(serviceRoleKey))
            {
                throw new InvalidOperationException("Supabase URL or ServiceRoleKey is not configured.");
            }

            if (LooksLikeStoredPath(bytes))
            {
                throw new InvalidOperationException("Credential payload looks like a file path, not image bytes.");
            }

            var hexPayload = "\\x" + Convert.ToHexString(bytes).ToLowerInvariant();
            var body = new Dictionary<string, object?>
            {
                ["CredentialsFile"] = hexPayload,
                ["CredentialsFileName"] = fileName,
                ["CredentialsContentType"] = contentType ?? "application/octet-stream",
                ["UpdatedAt"] = DateTime.UtcNow
            };

            using var http = new HttpClient();
            http.DefaultRequestHeaders.Add("apikey", serviceRoleKey);
            http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", serviceRoleKey);
            http.DefaultRequestHeaders.Add("Prefer", "return=minimal");

            var json = JsonSerializer.Serialize(body);
            using var content = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await http.PatchAsync(
                $"{supabaseUrl}/rest/v1/Veterinarians?Id=eq.{vetId}",
                content,
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError(
                    "Failed to save CredentialsFile for vet {VetId}. Status={Status} Body={Body}",
                    vetId,
                    response.StatusCode,
                    errorBody);
                throw new InvalidOperationException(
                    $"Failed to save credential file to database: {errorBody}");
            }
        }

        public async Task<(byte[] Bytes, string FileName, string ContentType)?> LoadCredentialsAsync(
            Guid vetId,
            CancellationToken cancellationToken = default)
        {
            var supabaseUrl = _config["Supabase:Url"]?.TrimEnd('/');
            var serviceRoleKey = _config["Supabase:ServiceRoleKey"];
            if (string.IsNullOrWhiteSpace(supabaseUrl) || string.IsNullOrWhiteSpace(serviceRoleKey))
            {
                return null;
            }

            using var http = new HttpClient();
            http.DefaultRequestHeaders.Add("apikey", serviceRoleKey);
            http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", serviceRoleKey);

            var response = await http.GetAsync(
                $"{supabaseUrl}/rest/v1/Veterinarians?Id=eq.{vetId}&select=CredentialsFile,CredentialsFileName,CredentialsContentType",
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
            if (doc.RootElement.ValueKind != JsonValueKind.Array || doc.RootElement.GetArrayLength() == 0)
            {
                return null;
            }

            var row = doc.RootElement[0];
            var bytes = row.TryGetProperty("CredentialsFile", out var fileEl)
                ? ParseByteaFromJson(fileEl)
                : null;
            var fileName = row.TryGetProperty("CredentialsFileName", out var nameEl)
                ? nameEl.GetString()
                : null;
            var contentType = row.TryGetProperty("CredentialsContentType", out var typeEl)
                ? typeEl.GetString()
                : null;

            bytes = NormalizeCredentialBytes(bytes, _env);
            if (bytes == null || bytes.Length == 0 || string.IsNullOrWhiteSpace(fileName))
            {
                return null;
            }

            return (bytes, fileName, contentType ?? "application/octet-stream");
        }

        public static byte[]? NormalizeCredentialBytes(byte[]? bytes, IWebHostEnvironment? env = null)
        {
            if (bytes == null || bytes.Length == 0)
            {
                return null;
            }

            if (!LooksLikeStoredPath(bytes))
            {
                return bytes;
            }

            var pathText = Encoding.UTF8.GetString(bytes).Trim();
            if (env != null)
            {
                var relative = pathText.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
                var fullPath = Path.Combine(env.WebRootPath, relative);
                if (File.Exists(fullPath))
                {
                    return File.ReadAllBytes(fullPath);
                }
            }

            return null;
        }

        public static bool LooksLikeStoredPath(byte[] bytes)
        {
            if (bytes.Length == 0 || bytes.Length > 2048)
            {
                return false;
            }

            try
            {
                var text = Encoding.UTF8.GetString(bytes).Trim();
                return text.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase)
                       || text.StartsWith("uploads/", StringComparison.OrdinalIgnoreCase)
                       || text.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
                       || text.StartsWith("https://", StringComparison.OrdinalIgnoreCase);
            }
            catch
            {
                return false;
            }
        }

        public static byte[]? ParseByteaFromJson(JsonElement element)
        {
            if (element.ValueKind == JsonValueKind.Null)
            {
                return null;
            }

            if (element.ValueKind == JsonValueKind.String)
            {
                var value = element.GetString();
                if (string.IsNullOrEmpty(value))
                {
                    return null;
                }

                if (value.StartsWith("\\x", StringComparison.OrdinalIgnoreCase))
                {
                    return Convert.FromHexString(value[2..]);
                }

                try
                {
                    return Convert.FromBase64String(value);
                }
                catch
                {
                    return Encoding.UTF8.GetBytes(value);
                }
            }

            return null;
        }
    }
}
