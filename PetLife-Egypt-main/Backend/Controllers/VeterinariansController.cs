using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using petLifeApp.Models;
using Supabase;
using Supabase.Postgrest;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net.Http.Headers;
using System.Text.Json;

namespace petLifeApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VeterinariansController : ControllerBase
    {
        private readonly Supabase.Client _supabase;
        private readonly IConfiguration _config;
        private readonly JsonSerializerOptions _jsonOptions = new()
        {
            PropertyNameCaseInsensitive = true
        };

        public VeterinariansController(Supabase.Client supabase, IConfiguration config)
        {
            _supabase = supabase;
            _config = config;
        }

        private Supabase.Client GetAdminClient()
        {
            var supabaseUrl = _config["Supabase:Url"];
            var serviceRoleKey = _config["Supabase:ServiceRoleKey"];

            if (!string.IsNullOrWhiteSpace(supabaseUrl) && !string.IsNullOrWhiteSpace(serviceRoleKey))
            {
                return new Supabase.Client(supabaseUrl, serviceRoleKey);
            }

            return _supabase;
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

        private sealed class VetMetadataFallback
        {
            public string? University { get; set; }
            public int? YearsOfExperience { get; set; }
            public string? Bio { get; set; }
            public string? CredentialFileName { get; set; }
            public string? CredentialContentType { get; set; }
        }

        private async Task<VetMetadataFallback?> GetVetMetadataFallbackAsync(Guid? authId)
        {
            if (!authId.HasValue || authId.Value == Guid.Empty)
            {
                return null;
            }

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

                var response = await client.GetAsync($"{supabaseUrl.TrimEnd('/')}/auth/v1/admin/users/{authId.Value}");
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

                return new VetMetadataFallback
                {
                    University = ReadString(metadata, "university"),
                    YearsOfExperience = ReadInt(metadata, "yearsOfExperience"),
                    Bio = ReadString(metadata, "bio"),
                    CredentialFileName = ReadString(metadata, "credentialFileName"),
                    CredentialContentType = ReadString(metadata, "credentialContentType")
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

        private static VeterinarianProfileRecord MergeVetProfile(VeterinarianProfileRecord vet, VetMetadataFallback? fallback)
        {
            if (fallback == null)
            {
                return vet;
            }

            return new VeterinarianProfileRecord
            {
                Id = vet.Id,
                UserId = vet.UserId,
                Specialization = vet.Specialization,
                ClinicName = vet.ClinicName,
                LicenseNumber = vet.LicenseNumber,
                University = string.IsNullOrWhiteSpace(vet.University) ? fallback.University : vet.University,
                YearsOfExperience = vet.YearsOfExperience ?? fallback.YearsOfExperience,
                Bio = string.IsNullOrWhiteSpace(vet.Bio) ? fallback.Bio : vet.Bio,
                CredentialsFileName = string.IsNullOrWhiteSpace(vet.CredentialsFileName) ? fallback.CredentialFileName : vet.CredentialsFileName,
                CredentialsContentType = string.IsNullOrWhiteSpace(vet.CredentialsContentType) ? fallback.CredentialContentType : vet.CredentialsContentType,
                IsVerified = vet.IsVerified,
                IsOnline = vet.IsOnline,
                CreatedAt = vet.CreatedAt,
                UpdatedAt = vet.UpdatedAt
            };
        }

        private async Task<long> ResolveUserIdAsync(long? userId)
        {
            if (userId.HasValue && userId.Value > 0)
            {
                return userId.Value;
            }

            var authHeader = Request.Headers.Authorization.FirstOrDefault();
            if (string.IsNullOrWhiteSpace(authHeader) || !authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                return 0;
            }

            var token = authHeader.Substring("Bearer ".Length).Trim();
            try
            {
                var handler = new JwtSecurityTokenHandler();
                var jwt = handler.ReadJwtToken(token);
                var sub = jwt.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;
                if (!Guid.TryParse(sub, out var authId))
                {
                    return 0;
                }

                var adminClient = GetAdminClient();
                var user = await adminClient.From<User>().Where(x => x.AuthId == authId).Single();
                return user?.UserId ?? 0;
            }
            catch
            {
                return 0;
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var adminClient = GetAdminClient();
                var vetsResult = await adminClient.From<VeterinarianProfileRecord>().Get();
                var approvedVets = vetsResult.Models
                    .Where(v => v.IsVerified == true)
                    .ToList();

                var payload = new List<VeterinarianDto>();
                foreach (var vet in approvedVets)
                {
                    var user = await adminClient.From<User>().Where(x => x.UserId == vet.UserId).Single();
                    var mergedVet = MergeVetProfile(vet, await GetVetMetadataFallbackAsync(user?.AuthId));
                    payload.Add(MapVet(mergedVet, user));
                }

                return Ok(payload);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            try
            {
                var adminClient = GetAdminClient();
                var vet = await adminClient.From<VeterinarianProfileRecord>().Where(x => x.Id == id).Single();
                if (vet == null || vet.IsVerified != true)
                    return NotFound(new { message = "Vet not found." });

                var user = await adminClient.From<User>().Where(x => x.UserId == vet.UserId).Single();
                var mergedVet = MergeVetProfile(vet, await GetVetMetadataFallbackAsync(user?.AuthId));
                return Ok(MapVet(mergedVet, user));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMe()
        {
            var resolvedUserId = await ResolveUserIdAsync(null);
            if (resolvedUserId <= 0)
                return Unauthorized(new { message = "Missing or invalid Authorization header." });

            try
            {
                var adminClient = GetAdminClient();
                var vet = await adminClient.From<VeterinarianProfileRecord>().Where(x => x.UserId == resolvedUserId).Single();
                if (vet == null)
                    return NotFound(new { message = "Vet profile not found." });

                var user = await adminClient.From<User>().Where(x => x.UserId == vet.UserId).Single();
                var mergedVet = MergeVetProfile(vet, await GetVetMetadataFallbackAsync(user?.AuthId));
                return Ok(MapVetProfile(mergedVet, user));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("me")]
        public async Task<IActionResult> UpdateMe([FromBody] UpdateVetProfileRequest request)
        {
            var resolvedUserId = await ResolveUserIdAsync(null);
            if (resolvedUserId <= 0)
                return Unauthorized(new { message = "Missing or invalid Authorization header." });

            try
            {
                var adminClient = GetAdminClient();
                var existing = await adminClient.From<VeterinarianProfileRecord>().Where(x => x.UserId == resolvedUserId).Single();
                var now = DateTime.UtcNow;
                if (existing == null)
                {
                    var vetInsert = new VeterinarianInsert
                    {
                        Id = Guid.NewGuid(),
                        UserId = resolvedUserId,
                        LicenseNumber = request.LicenseNumber,
                        Specialization = request.Specialization,
                        ClinicName = request.ClinicName,
                        IsVerified = false
                    };

                    await adminClient.From<VeterinarianInsert>().Insert(vetInsert);
                    existing = new VeterinarianProfileRecord
                    {
                        Id = vetInsert.Id,
                        UserId = vetInsert.UserId,
                        LicenseNumber = vetInsert.LicenseNumber,
                        Specialization = vetInsert.Specialization,
                        ClinicName = vetInsert.ClinicName,
                        IsVerified = vetInsert.IsVerified
                    };
                }

                var coreUpdate = new VeterinarianInsert
                {
                    Id = existing.Id,
                    UserId = existing.UserId,
                    Specialization = request.Specialization ?? existing.Specialization,
                    ClinicName = request.ClinicName ?? existing.ClinicName,
                    LicenseNumber = request.LicenseNumber ?? existing.LicenseNumber,
                    IsVerified = existing.IsVerified
                };

                await adminClient.From<VeterinarianInsert>().Update(coreUpdate);

                var extrasUpdate = new VeterinarianExtrasUpdate
                {
                    Id = existing.Id,
                    University = request.University ?? existing.University,
                    YearsOfExperience = request.YearsOfExperience ?? existing.YearsOfExperience,
                    Bio = request.Bio ?? existing.Bio,
                    IsOnline = existing.IsOnline,
                    UpdatedAt = now
                };

                try
                {
                    await adminClient.From<VeterinarianExtrasUpdate>().Update(extrasUpdate);
                }
                catch
                {
                    // Ignore optional columns that may not exist yet.
                }

                var user = await adminClient.From<User>().Where(x => x.UserId == existing.UserId).Single();
                var refreshed = await adminClient.From<VeterinarianProfileRecord>().Where(x => x.Id == existing.Id).Single();
                var mergedVet = MergeVetProfile(refreshed ?? existing, await GetVetMetadataFallbackAsync(user?.AuthId));
                return Ok(MapVetProfile(mergedVet, user));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("me/availability")]
        public async Task<IActionResult> UpdateAvailability([FromBody] UpdateVetAvailabilityRequest request)
        {
            var resolvedUserId = await ResolveUserIdAsync(null);
            if (resolvedUserId <= 0)
                return Unauthorized(new { message = "Missing or invalid Authorization header." });

            try
            {
                var adminClient = GetAdminClient();
                var existing = await adminClient.From<VeterinarianProfileRecord>().Where(x => x.UserId == resolvedUserId).Single();
                if (existing == null)
                    return NotFound(new { message = "Vet profile not found." });

                await adminClient.From<VeterinarianAvailabilityUpdate>().Update(
                    new VeterinarianAvailabilityUpdate
                    {
                        Id = existing.Id,
                        IsOnline = request.IsOnline,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new QueryOptions
                    {
                        Returning = QueryOptions.ReturnType.Minimal
                    });
                return Ok(new { vetId = existing.Id, isOnline = request.IsOnline });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("credentials")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadCredentials([FromForm] UploadCredentialsRequest request)
        {
            var file = request.File;
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "File is required." });

            var resolvedUserId = await ResolveUserIdAsync(null);
            if (resolvedUserId <= 0)
                return Unauthorized(new { message = "Missing or invalid Authorization header." });

            try
            {
                var adminClient = GetAdminClient();
                var vet = await adminClient.From<VeterinarianProfileRecord>().Where(x => x.UserId == resolvedUserId).Single();
                if (vet == null)
                {
                    var vetInsert = new VeterinarianInsert
                    {
                        Id = Guid.NewGuid(),
                        UserId = resolvedUserId,
                        IsVerified = false
                    };
                    await adminClient.From<VeterinarianInsert>().Insert(vetInsert);
                    vet = new VeterinarianProfileRecord
                    {
                        Id = vetInsert.Id,
                        UserId = vetInsert.UserId,
                        IsVerified = vetInsert.IsVerified
                    };
                }

                byte[] bytes;
                await using (var ms = new MemoryStream())
                {
                    await file.CopyToAsync(ms);
                    bytes = ms.ToArray();
                }

                var update = new VeterinarianCredentialsUpdate
                {
                    Id = vet.Id,
                    CredentialsFile = bytes,
                    CredentialsFileName = file.FileName,
                    CredentialsContentType = file.ContentType
                };

                try
                {
                    var options = new QueryOptions { Returning = QueryOptions.ReturnType.Minimal };
                    await adminClient.From<VeterinarianCredentialsUpdate>().Update(update, options);
                }
                catch (Exception updateEx)
                {
                    return BadRequest(new
                    {
                        message = "Failed to save credentials. Check RLS policies and column names.",
                        details = updateEx.Message
                    });
                }

                return Ok(new { fileName = file.FileName });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        private static VeterinarianDto MapVet(VeterinarianProfileRecord vet, User? user)
        {
            var fee = 150m;
            return new VeterinarianDto(
                vet.Id,
                vet.UserId,
                user?.UserName ?? "Veterinarian",
                null,
                vet.Specialization ?? "General Practice",
                vet.ClinicName ?? "Clinic",
                "Not set",
                user?.Phone ?? "",
                4.8m,
                0,
                vet.IsVerified ?? false,
                fee,
                null,
                vet.IsOnline ?? false
            );
        }

        private static VetProfileDto MapVetProfile(VeterinarianProfileRecord vet, User? user)
        {
            return new VetProfileDto(
                vet.Id,
                vet.UserId,
                user?.UserName ?? "Veterinarian",
                null,
                user?.Phone ?? "",
                vet.Specialization,
                vet.ClinicName,
                null,
                vet.LicenseNumber,
                vet.University,
                vet.YearsOfExperience,
                vet.Bio,
                150,
                vet.IsVerified ?? false,
                vet.CredentialsFileName,
                vet.CredentialsContentType,
                vet.IsOnline ?? false
            );
        }
    }

    public record VeterinarianDto(
        Guid Id,
        long UserId,
        string Name,
        string? Avatar,
        string Specialty,
        string ClinicName,
        string ClinicAddress,
        string Phone,
        decimal Rating,
        int ReviewCount,
        bool IsVerified,
        decimal ConsultationFee,
        string? ClinicLocationUrl,
        bool IsOnline
    );

    public record VetProfileDto(
        Guid Id,
        long UserId,
        string Name,
        string? Avatar,
        string Phone,
        string? Specialty,
        string? ClinicName,
        string? ClinicAddress,
        string? LicenseNumber,
        string? University,
        int? YearsOfExperience,
        string? Bio,
        decimal ConsultationFee,
        bool IsVerified,
        string? CredentialsFileName,
        string? CredentialsContentType,
        bool IsOnline
    );

    public record UpdateVetProfileRequest(
        string? LicenseNumber,
        string? Specialization,
        string? ClinicName,
        string? ClinicAddress,
        string? ClinicLocationUrl,
        string? University,
        int? YearsOfExperience,
        string? Bio,
        decimal? ConsultationFee,
        string? AvatarUrl,
        string? Phone
    );

    public class UploadCredentialsRequest
    {
        public IFormFile File { get; set; } = null!;
    }

    public record UpdateVetAvailabilityRequest(bool IsOnline);
}
