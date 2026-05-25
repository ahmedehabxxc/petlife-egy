using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace petLifeApp.Services
{
    /// <summary>
    /// Writes vet profile fields via PostgREST with PascalCase column names (Id, UserId, etc.).
    /// </summary>
    public class SupabaseVetProfileStore
    {
        private readonly IConfiguration _config;
        private readonly ILogger<SupabaseVetProfileStore> _logger;

        public SupabaseVetProfileStore(IConfiguration config, ILogger<SupabaseVetProfileStore> logger)
        {
            _config = config;
            _logger = logger;
        }

        public async Task PatchVeterinarianAsync(
            Guid vetId,
            VetProfilePatch patch,
            CancellationToken cancellationToken = default)
        {
            var body = patch.ToDictionary();
            if (body.Count == 0)
            {
                return;
            }

            body["UpdatedAt"] = DateTime.UtcNow;
            await PatchTableAsync("Veterinarians", "Id", vetId.ToString(), body, cancellationToken);
        }

        public async Task PatchUserPhoneAsync(long userId, string phone, CancellationToken cancellationToken = default)
        {
            await PatchTableAsync(
                "Users",
                "UserId",
                userId.ToString(),
                new Dictionary<string, object?>
                {
                    ["Phone"] = phone
                },
                cancellationToken);
        }

        public async Task<int?> GetYearsOfExperienceAsync(Guid vetId, CancellationToken cancellationToken = default)
        {
            var row = await GetVeterinarianRowAsync(vetId, cancellationToken);
            return row?.YearsOfExperience;
        }

        public async Task<List<VeterinarianRestRow>> ListVeterinariansViaRestAsync(CancellationToken cancellationToken = default)
        {
            var supabaseUrl = _config["Supabase:Url"]?.TrimEnd('/');
            var serviceRoleKey = _config["Supabase:ServiceRoleKey"];
            if (string.IsNullOrWhiteSpace(supabaseUrl) || string.IsNullOrWhiteSpace(serviceRoleKey))
            {
                return new List<VeterinarianRestRow>();
            }

            using var http = CreateHttpClient(serviceRoleKey);
            var select = "Id,UserId,LicenseNumber,Specialization,ClinicName,YearsOfExperience,University,Bio," +
                         "CredentialsFileName,CredentialsContentType,IsVerified,CreatedAt,UpdatedAt";
            var response = await http.GetAsync(
                $"{supabaseUrl}/rest/v1/Veterinarians?select={select}",
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("GET Veterinarians failed: {Body}", error);
                return new List<VeterinarianRestRow>();
            }

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
            if (doc.RootElement.ValueKind != JsonValueKind.Array)
            {
                return new List<VeterinarianRestRow>();
            }

            var rows = new List<VeterinarianRestRow>();
            foreach (var element in doc.RootElement.EnumerateArray())
            {
                var row = ParseVeterinarianRow(element);
                if (row != null)
                {
                    rows.Add(row);
                }
            }

            return rows;
        }

        public async Task<VeterinarianRestRow?> GetVeterinarianRowAsync(Guid vetId, CancellationToken cancellationToken = default)
        {
            var supabaseUrl = _config["Supabase:Url"]?.TrimEnd('/');
            var serviceRoleKey = _config["Supabase:ServiceRoleKey"];
            if (string.IsNullOrWhiteSpace(supabaseUrl) || string.IsNullOrWhiteSpace(serviceRoleKey))
            {
                return null;
            }

            using var http = CreateHttpClient(serviceRoleKey);
            var select = "Id,UserId,LicenseNumber,Specialization,ClinicName,YearsOfExperience,University,Bio," +
                         "CredentialsFileName,IsVerified,CreatedAt,UpdatedAt";
            var response = await http.GetAsync(
                $"{supabaseUrl}/rest/v1/Veterinarians?Id=eq.{vetId}&select={select}",
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

            return ParseVeterinarianRow(doc.RootElement[0]);
        }

        private static VeterinarianRestRow? ParseVeterinarianRow(JsonElement element)
        {
            var id = ReadGuid(element, "Id", "id");
            if (!id.HasValue)
            {
                return null;
            }

            return new VeterinarianRestRow
            {
                Id = id.Value,
                UserId = ReadLong(element, "UserId", "userId") ?? 0,
                LicenseNumber = ReadString(element, "LicenseNumber", "licenseNumber"),
                Specialization = ReadString(element, "Specialization", "specialization"),
                ClinicName = ReadString(element, "ClinicName", "clinicName"),
                YearsOfExperience = ReadInt(element, "YearsOfExperience", "yearsOfExperience"),
                University = ReadString(element, "University", "university"),
                Bio = ReadString(element, "Bio", "bio"),
                CredentialsFileName = ReadString(element, "CredentialsFileName", "credentialsFileName"),
                IsVerified = ReadBool(element, "IsVerified", "isVerified"),
                CreatedAt = ReadDateTime(element, "CreatedAt", "createdAt"),
                UpdatedAt = ReadDateTime(element, "UpdatedAt", "updatedAt")
            };
        }

        private static HttpClient CreateHttpClient(string serviceRoleKey)
        {
            var http = new HttpClient();
            http.DefaultRequestHeaders.Add("apikey", serviceRoleKey);
            http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", serviceRoleKey);
            return http;
        }

        private static string? ReadString(JsonElement element, string pascal, string camel)
        {
            if (TryGetProperty(element, pascal, camel, out var prop) && prop.ValueKind == JsonValueKind.String)
            {
                return prop.GetString();
            }
            return null;
        }

        private static int? ReadInt(JsonElement element, string pascal, string camel)
        {
            if (!TryGetProperty(element, pascal, camel, out var prop))
            {
                return null;
            }

            if (prop.ValueKind == JsonValueKind.Number && prop.TryGetInt32(out var n))
            {
                return n;
            }

            if (prop.ValueKind == JsonValueKind.String && int.TryParse(prop.GetString(), out var parsed))
            {
                return parsed;
            }

            return null;
        }

        private static long? ReadLong(JsonElement element, string pascal, string camel)
        {
            if (!TryGetProperty(element, pascal, camel, out var prop))
            {
                return null;
            }

            if (prop.ValueKind == JsonValueKind.Number && prop.TryGetInt64(out var n))
            {
                return n;
            }

            return null;
        }

        private static Guid? ReadGuid(JsonElement element, string pascal, string camel)
        {
            var s = ReadString(element, pascal, camel);
            return Guid.TryParse(s, out var g) ? g : null;
        }

        private static bool? ReadBool(JsonElement element, string pascal, string camel)
        {
            if (!TryGetProperty(element, pascal, camel, out var prop))
            {
                return null;
            }

            if (prop.ValueKind == JsonValueKind.True) return true;
            if (prop.ValueKind == JsonValueKind.False) return false;
            return null;
        }

        private static DateTime? ReadDateTime(JsonElement element, string pascal, string camel)
        {
            var s = ReadString(element, pascal, camel);
            return DateTime.TryParse(s, out var dt) ? dt : null;
        }

        private static bool TryGetProperty(JsonElement element, string pascal, string camel, out JsonElement prop)
        {
            if (element.TryGetProperty(pascal, out prop))
            {
                return true;
            }

            return element.TryGetProperty(camel, out prop);
        }

        public async Task EnsureYearsOfExperienceSavedAsync(
            Guid vetId,
            int years,
            CancellationToken cancellationToken = default)
        {
            var current = await GetYearsOfExperienceAsync(vetId, cancellationToken);
            if (current == years)
            {
                return;
            }

            await PatchVeterinarianAsync(
                vetId,
                new VetProfilePatch { YearsOfExperience = years },
                cancellationToken);
        }

        public async Task<VeterinarianRestRow?> GetByUserIdAsync(long userId, CancellationToken cancellationToken = default)
        {
            var supabaseUrl = _config["Supabase:Url"]?.TrimEnd('/');
            var serviceRoleKey = _config["Supabase:ServiceRoleKey"];
            if (string.IsNullOrWhiteSpace(supabaseUrl) || string.IsNullOrWhiteSpace(serviceRoleKey))
            {
                return null;
            }

            using var http = CreateHttpClient(serviceRoleKey);
            var select = "Id,UserId,LicenseNumber,Specialization,ClinicName,YearsOfExperience,University,Bio," +
                         "CredentialsFileName,IsVerified,CreatedAt,UpdatedAt";
            var response = await http.GetAsync(
                $"{supabaseUrl}/rest/v1/Veterinarians?UserId=eq.{userId}&select={select}",
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

            return ParseVeterinarianRow(doc.RootElement[0]);
        }

        /// <summary>
        /// Creates or updates a veterinarian row using PostgREST only (reliable PascalCase columns).
        /// </summary>
        public async Task<Guid> UpsertVeterinarianRegistrationAsync(
            VeterinarianRegistrationData data,
            CancellationToken cancellationToken = default)
        {
            var existing = await GetByUserIdAsync(data.UserId, cancellationToken);
            var now = DateTime.UtcNow;
            var body = data.ToDictionary();
            body["UpdatedAt"] = now;

            if (existing == null)
            {
                var id = Guid.NewGuid();
                body["Id"] = id;
                body["UserId"] = data.UserId;
                body["IsVerified"] = data.IsVerified ?? false;
                body["CreatedAt"] = now;
                await PostTableAsync("Veterinarians", body, cancellationToken);
                return id;
            }

            await PatchTableAsync("Veterinarians", "Id", existing.Id.ToString(), body, cancellationToken);
            return existing.Id;
        }

        public async Task SyncProfileFromAuthAsync(
            Guid vetId,
            VetAuthMetadata metadata,
            CancellationToken cancellationToken = default)
        {
            var patch = new VetProfilePatch();
            if (!string.IsNullOrWhiteSpace(metadata.University))
            {
                patch.University = metadata.University;
            }

            if (metadata.YearsOfExperience is > 0)
            {
                patch.YearsOfExperience = metadata.YearsOfExperience;
            }

            if (!string.IsNullOrWhiteSpace(metadata.Bio))
            {
                patch.Bio = metadata.Bio;
            }

            if (!string.IsNullOrWhiteSpace(metadata.LicenseNumber))
            {
                patch.LicenseNumber = metadata.LicenseNumber;
            }

            if (!string.IsNullOrWhiteSpace(metadata.Specialization))
            {
                patch.Specialization = metadata.Specialization;
            }

            if (!string.IsNullOrWhiteSpace(metadata.ClinicName))
            {
                patch.ClinicName = metadata.ClinicName;
            }

            if (patch.ToDictionary().Count == 0)
            {
                return;
            }

            await PatchVeterinarianAsync(vetId, patch, cancellationToken);
        }

        private async Task PostTableAsync(
            string table,
            Dictionary<string, object?> body,
            CancellationToken cancellationToken)
        {
            var supabaseUrl = _config["Supabase:Url"]?.TrimEnd('/');
            var serviceRoleKey = _config["Supabase:ServiceRoleKey"];
            if (string.IsNullOrWhiteSpace(supabaseUrl) || string.IsNullOrWhiteSpace(serviceRoleKey))
            {
                throw new InvalidOperationException("Supabase URL or ServiceRoleKey is not configured.");
            }

            using var http = CreateHttpClient(serviceRoleKey);
            http.DefaultRequestHeaders.Add("Prefer", "return=minimal");

            var json = JsonSerializer.Serialize(body, JsonOptions);
            using var content = new StringContent(json, Encoding.UTF8, "application/json");
            var url = $"{supabaseUrl}/rest/v1/{table}";
            var response = await http.PostAsync(url, content, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("POST {Table} failed: {Status} {Body}", table, response.StatusCode, errorBody);
                throw new InvalidOperationException($"Failed to insert into {table}: {errorBody}");
            }
        }

        private async Task PatchTableAsync(
            string table,
            string keyColumn,
            string keyValue,
            Dictionary<string, object?> body,
            CancellationToken cancellationToken)
        {
            var supabaseUrl = _config["Supabase:Url"]?.TrimEnd('/');
            var serviceRoleKey = _config["Supabase:ServiceRoleKey"];
            if (string.IsNullOrWhiteSpace(supabaseUrl) || string.IsNullOrWhiteSpace(serviceRoleKey))
            {
                throw new InvalidOperationException("Supabase URL or ServiceRoleKey is not configured.");
            }

            using var http = new HttpClient();
            http.DefaultRequestHeaders.Add("apikey", serviceRoleKey);
            http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", serviceRoleKey);
            http.DefaultRequestHeaders.Add("Prefer", "return=minimal");

            var json = JsonSerializer.Serialize(body, JsonOptions);
            using var content = new StringContent(json, Encoding.UTF8, "application/json");
            var url = $"{supabaseUrl}/rest/v1/{table}?{keyColumn}=eq.{keyValue}";
            var response = await http.PatchAsync(url, content, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("PATCH {Table} failed: {Status} {Body}", table, response.StatusCode, errorBody);
                throw new InvalidOperationException($"Failed to update {table}: {errorBody}");
            }
        }

        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };
    }

    public class VetProfilePatch
    {
        public string? LicenseNumber { get; set; }
        public string? Specialization { get; set; }
        public string? ClinicName { get; set; }
        public string? ClinicAddress { get; set; }
        public string? University { get; set; }
        public int? YearsOfExperience { get; set; }
        public string? Bio { get; set; }
        public decimal? ConsultationFee { get; set; }
        public string? AvatarUrl { get; set; }
        public string? AvailableHours { get; set; }

        public Dictionary<string, object?> ToDictionary()
        {
            var map = new Dictionary<string, object?>();
            if (LicenseNumber != null) map["LicenseNumber"] = LicenseNumber;
            if (Specialization != null) map["Specialization"] = Specialization;
            if (ClinicName != null) map["ClinicName"] = ClinicName;
            if (ClinicAddress != null) map["ClinicAddress"] = ClinicAddress;
            if (University != null) map["University"] = University;
            if (YearsOfExperience.HasValue) map["YearsOfExperience"] = YearsOfExperience.Value;
            if (Bio != null) map["Bio"] = Bio;
            if (ConsultationFee.HasValue) map["ConsultationFee"] = ConsultationFee.Value;
            if (AvatarUrl != null) map["AvatarUrl"] = AvatarUrl;
            if (AvailableHours != null) map["AvailableHours"] = AvailableHours;
            return map;
        }
    }

    public class VeterinarianRestRow
    {
        public Guid Id { get; set; }
        public long UserId { get; set; }
        public string? LicenseNumber { get; set; }
        public string? Specialization { get; set; }
        public string? ClinicName { get; set; }
        public int? YearsOfExperience { get; set; }
        public string? University { get; set; }
        public string? Bio { get; set; }
        public string? CredentialsFileName { get; set; }
        public bool? IsVerified { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class VeterinarianRegistrationData
    {
        public long UserId { get; set; }
        public string? LicenseNumber { get; set; }
        public string? Specialization { get; set; }
        public string? ClinicName { get; set; }
        public string? University { get; set; }
        public int? YearsOfExperience { get; set; }
        public string? Bio { get; set; }
        public decimal? ConsultationFee { get; set; }
        public string? ClinicAddress { get; set; }
        public string? AvailableHours { get; set; }
        public string? AvatarUrl { get; set; }
        public bool? IsVerified { get; set; }

        public Dictionary<string, object?> ToDictionary()
        {
            var map = new Dictionary<string, object?>();
            if (LicenseNumber != null) map["LicenseNumber"] = LicenseNumber;
            if (Specialization != null) map["Specialization"] = Specialization;
            if (ClinicName != null) map["ClinicName"] = ClinicName;
            if (University != null) map["University"] = University;
            if (YearsOfExperience.HasValue) map["YearsOfExperience"] = YearsOfExperience.Value;
            if (Bio != null) map["Bio"] = Bio;
            if (ConsultationFee.HasValue) map["ConsultationFee"] = ConsultationFee.Value;
            if (ClinicAddress != null) map["ClinicAddress"] = ClinicAddress;
            if (AvailableHours != null) map["AvailableHours"] = AvailableHours;
            if (AvatarUrl != null) map["AvatarUrl"] = AvatarUrl;

            return map;
        }
    }
}
