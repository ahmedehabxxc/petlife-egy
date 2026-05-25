using System.Net.Http.Headers;
using System.Text.Json;

namespace petLifeApp.Services
{
    public class VetAuthMetadataService
    {
        private readonly IConfiguration _config;
        private readonly JsonSerializerOptions _jsonOptions = new() { PropertyNameCaseInsensitive = true };

        public VetAuthMetadataService(IConfiguration config)
        {
            _config = config;
        }

        public async Task<int?> GetYearsOfExperienceAsync(Guid authId)
        {
            var metadata = await GetMetadataAsync(authId);
            return metadata?.YearsOfExperience;
        }

        public async Task<VetAuthMetadata?> GetMetadataAsync(Guid authId)
        {
            var supabaseUrl = _config["Supabase:Url"];
            var serviceRoleKey = _config["Supabase:ServiceRoleKey"];
            if (string.IsNullOrWhiteSpace(supabaseUrl) || string.IsNullOrWhiteSpace(serviceRoleKey))
            {
                return null;
            }

            try
            {
                using var client = new HttpClient();
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", serviceRoleKey);
                client.DefaultRequestHeaders.Add("apikey", serviceRoleKey);

                var response = await client.GetAsync($"{supabaseUrl.TrimEnd('/')}/auth/v1/admin/users/{authId}");
                if (!response.IsSuccessStatusCode)
                {
                    return null;
                }

                await using var stream = await response.Content.ReadAsStreamAsync();
                var payload = await JsonSerializer.DeserializeAsync<AuthAdminUserResponse>(stream, _jsonOptions);
                var metadata = payload?.User?.UserMetadata ?? payload?.User?.User_Metadata;
                if (metadata == null)
                {
                    return null;
                }

                return new VetAuthMetadata
                {
                    LicenseNumber = ReadString(metadata, "licenseNumber"),
                    Specialization = ReadString(metadata, "specialization"),
                    ClinicName = ReadString(metadata, "clinicName"),
                    University = ReadString(metadata, "university"),
                    YearsOfExperience = ReadInt(metadata, "yearsOfExperience"),
                    Bio = ReadString(metadata, "bio")
                };
            }
            catch
            {
                return null;
            }
        }

        private static string? ReadString(Dictionary<string, JsonElement> metadata, string key)
        {
            if (!metadata.TryGetValue(key, out var element))
            {
                return null;
            }

            if (element.ValueKind == JsonValueKind.String)
            {
                var value = element.GetString();
                return string.IsNullOrWhiteSpace(value) ? null : value;
            }

            return element.ToString();
        }

        private static int? ReadInt(Dictionary<string, JsonElement> metadata, string key)
        {
            if (!metadata.TryGetValue(key, out var element))
            {
                return null;
            }

            if (element.ValueKind == JsonValueKind.Number && element.TryGetInt32(out var number))
            {
                return number;
            }

            if (element.ValueKind == JsonValueKind.String && int.TryParse(element.GetString(), out var parsed))
            {
                return parsed;
            }

            return null;
        }

        private sealed class AuthAdminUserResponse
        {
            public AuthAdminUser? User { get; set; }
        }

        private sealed class AuthAdminUser
        {
            public Dictionary<string, JsonElement>? User_Metadata { get; set; }
            public Dictionary<string, JsonElement>? UserMetadata { get; set; }
        }
    }

    public class VetAuthMetadata
    {
        public string? LicenseNumber { get; set; }
        public string? Specialization { get; set; }
        public string? ClinicName { get; set; }
        public string? University { get; set; }
        public int? YearsOfExperience { get; set; }
        public string? Bio { get; set; }
    }
}
