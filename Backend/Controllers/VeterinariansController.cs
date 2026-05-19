using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using petLifeApp.Models;
using petLifeApp.Services;
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
        private readonly IWebHostEnvironment _env;
        private readonly VetCredentialFileService _credentialFiles;
        private readonly VetCredentialPersistence _credentialPersistence;
        private readonly SupabaseCredentialStore _credentialStore;
        private readonly SupabaseVetProfileStore _vetProfileStore;
        private readonly JsonSerializerOptions _jsonOptions = new()
        {
            PropertyNameCaseInsensitive = true
        };

        public VeterinariansController(
            Supabase.Client supabase,
            IConfiguration config,
            IWebHostEnvironment env,
            VetCredentialFileService credentialFiles,
            VetCredentialPersistence credentialPersistence,
            SupabaseCredentialStore credentialStore,
            SupabaseVetProfileStore vetProfileStore)
        {
            _supabase = supabase;
            _config = config;
            _env = env;
            _credentialFiles = credentialFiles;
            _credentialPersistence = credentialPersistence;
            _credentialStore = credentialStore;
            _vetProfileStore = vetProfileStore;
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

        private async Task<Dictionary<Guid, (decimal Avg, int Count)>> GetReviewStatsByVetAsync(Supabase.Client adminClient)
        {
            try
            {
                var reviews = await adminClient.From<VetReviewRecord>().Get();
                return reviews.Models
                    .GroupBy(r => r.VetId)
                    .ToDictionary(
                        g => g.Key,
                        g => (
                            Avg: g.Any() ? Math.Round((decimal)g.Average(r => r.Rating), 1) : 0m,
                            Count: g.Count()
                        ));
            }
            catch
            {
                return new Dictionary<Guid, (decimal Avg, int Count)>();
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] string? specialty)
        {
            try
            {
                var adminClient = GetAdminClient();
                var vetsResult = await adminClient.From<VeterinarianProfileRecord>().Get();
                var reviewStats = await GetReviewStatsByVetAsync(adminClient);

                var approvedVets = vetsResult.Models
                    .Where(v => v.IsVerified == true)
                    .ToList();

                if (!string.IsNullOrWhiteSpace(specialty) && !string.Equals(specialty, "All", StringComparison.OrdinalIgnoreCase))
                {
                    approvedVets = approvedVets
                        .Where(v => string.Equals(v.Specialization, specialty, StringComparison.OrdinalIgnoreCase))
                        .ToList();
                }

                var usersResult = await adminClient.From<User>().Get();
                var userMap = usersResult.Models.ToDictionary(u => u.UserId, u => u);

                var payload = new List<VeterinarianDto>();
                foreach (var vet in approvedVets)
                {
                    userMap.TryGetValue(vet.UserId, out var user);
                    var mergedVet = MergeVetProfile(vet, await GetVetMetadataFallbackAsync(user?.AuthId));
                    reviewStats.TryGetValue(vet.Id, out var stats);
                    var name = user?.UserName ?? "Veterinarian";

                    if (!string.IsNullOrWhiteSpace(search))
                    {
                        var term = search.Trim().ToLowerInvariant();
                        if (!name.ToLowerInvariant().Contains(term) &&
                            !(mergedVet.ClinicName ?? "").ToLowerInvariant().Contains(term) &&
                            !(mergedVet.Specialization ?? "").ToLowerInvariant().Contains(term))
                        {
                            continue;
                        }
                    }

                    payload.Add(MapVet(mergedVet, user, stats.Avg, stats.Count));
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
                var reviewStats = await GetReviewStatsByVetAsync(adminClient);
                reviewStats.TryGetValue(vet.Id, out var stats);
                return Ok(MapVet(mergedVet, user, stats.Avg, stats.Count));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{id:guid}/reviews")]
        public async Task<IActionResult> GetReviews(Guid id)
        {
            try
            {
                var adminClient = GetAdminClient();
                var vet = await adminClient.From<VeterinarianProfileRecord>().Where(x => x.Id == id).Single();
                if (vet == null || vet.IsVerified != true)
                    return NotFound(new { message = "Vet not found." });

                var reviews = await adminClient.From<VetReviewRecord>()
                    .Where(x => x.VetId == id)
                    .Get();

                var users = await adminClient.From<User>().Get();
                var userMap = users.Models.ToDictionary(u => u.UserId, u => u);

                var payload = reviews.Models
                    .OrderByDescending(r => r.CreatedAt)
                    .Select(r =>
                {
                    userMap.TryGetValue(r.UserId, out var author);
                    return new VetReviewDto(
                        r.Id,
                        r.UserId,
                        author?.UserName ?? "Patient",
                        r.Rating,
                        r.Comment ?? "",
                        r.CreatedAt
                    );
                }).ToList();

                return Ok(payload);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id:guid}/reviews")]
        public async Task<IActionResult> AddReview(Guid id, [FromBody] AddVetReviewRequest request)
        {
            var resolvedUserId = await ResolveUserIdAsync(null);
            if (resolvedUserId <= 0)
                return Unauthorized(new { message = "Missing or invalid Authorization header." });

            if (request.Rating < 1 || request.Rating > 5)
                return BadRequest(new { message = "Rating must be between 1 and 5." });

            try
            {
                var adminClient = GetAdminClient();
                var vet = await adminClient.From<VeterinarianProfileRecord>().Where(x => x.Id == id).Single();
                if (vet == null || vet.IsVerified != true)
                    return NotFound(new { message = "Vet not found." });

                var insert = new VetReviewInsert
                {
                    Id = Guid.NewGuid(),
                    VetId = id,
                    UserId = resolvedUserId,
                    Rating = request.Rating,
                    Comment = request.Comment,
                    CreatedAt = DateTime.UtcNow
                };

                await adminClient.From<VetReviewInsert>().Insert(insert);
                return Ok(new { message = "Review submitted.", id = insert.Id });
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

                var yearsToSave = request.YearsOfExperience ?? existing.YearsOfExperience;
                await _vetProfileStore.PatchVeterinarianAsync(existing.Id, new VetProfilePatch
                {
                    ClinicAddress = request.ClinicAddress ?? existing.ClinicAddress,
                    University = request.University ?? existing.University,
                    YearsOfExperience = yearsToSave,
                    Bio = request.Bio ?? existing.Bio,
                    ConsultationFee = request.ConsultationFee ?? existing.ConsultationFee,
                    AvatarUrl = request.AvatarUrl ?? existing.AvatarUrl,
                    AvailableHours = request.AvailableHours ?? existing.AvailableHours
                });

                if (yearsToSave is int savedYears)
                {
                    await _vetProfileStore.EnsureYearsOfExperienceSavedAsync(existing.Id, savedYears);
                }

                if (!string.IsNullOrWhiteSpace(request.Phone))
                {
                    await _vetProfileStore.PatchUserPhoneAsync(existing.UserId, request.Phone);
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

        [HttpPost("me/avatar")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadAvatar([FromForm] UploadCredentialsRequest request)
        {
            var file = request.File;
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Image file is required." });

            var resolvedUserId = await ResolveUserIdAsync(null);
            if (resolvedUserId <= 0)
                return Unauthorized(new { message = "Missing or invalid Authorization header." });

            try
            {
                var adminClient = GetAdminClient();
                var existing = await adminClient.From<VeterinarianProfileRecord>().Where(x => x.UserId == resolvedUserId).Single();
                if (existing == null)
                    return NotFound(new { message = "Vet profile not found." });

                var uploadsDir = Path.Combine(_env.WebRootPath, "uploads", "vets");
                Directory.CreateDirectory(uploadsDir);

                var ext = Path.GetExtension(file.FileName);
                if (string.IsNullOrWhiteSpace(ext)) ext = ".jpg";
                var fileName = $"{existing.Id}{ext}";
                var filePath = Path.Combine(uploadsDir, fileName);

                await using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var avatarUrl = $"/uploads/vets/{fileName}";
                await _vetProfileStore.PatchVeterinarianAsync(existing.Id, new VetProfilePatch
                {
                    AvatarUrl = avatarUrl
                });

                return Ok(new { avatarUrl });
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

                var savedName = await _credentialPersistence.SaveAsync(
                    vet.Id,
                    bytes,
                    file.FileName,
                    file.ContentType);

                return Ok(new { fileName = savedName });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        private static VeterinarianDto MapVet(
            VeterinarianProfileRecord vet,
            User? user,
            decimal rating = 0m,
            int reviewCount = 0)
        {
            return new VeterinarianDto(
                vet.Id,
                vet.UserId,
                user?.UserName ?? "Veterinarian",
                vet.AvatarUrl,
                vet.Specialization ?? "General Practice",
                vet.ClinicName ?? "Clinic",
                vet.ClinicAddress ?? "Not set",
                user?.Phone ?? "",
                rating,
                reviewCount,
                vet.IsVerified ?? false,
                vet.ConsultationFee ?? 0m,
                vet.ClinicLocationUrl,
                vet.IsOnline ?? false,
                vet.AvailableHours
            );
        }

        private static VetProfileDto MapVetProfile(VeterinarianProfileRecord vet, User? user)
        {
            return new VetProfileDto(
                vet.Id,
                vet.UserId,
                user?.UserName ?? "Veterinarian",
                vet.AvatarUrl,
                user?.Phone ?? "",
                vet.Specialization,
                vet.ClinicName,
                vet.ClinicAddress,
                vet.LicenseNumber,
                vet.University,
                vet.YearsOfExperience,
                vet.Bio,
                vet.ConsultationFee ?? 0m,
                vet.IsVerified ?? false,
                vet.CredentialsFileName,
                vet.CredentialsContentType,
                vet.IsOnline ?? false,
                vet.AvailableHours,
                vet.ClinicLocationUrl
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
        bool IsOnline,
        string? AvailableHours
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
        bool IsOnline,
        string? AvailableHours,
        string? ClinicLocationUrl
    );

    public record VetReviewDto(
        Guid Id,
        long UserId,
        string AuthorName,
        int Rating,
        string Comment,
        DateTime? CreatedAt
    );

    public record AddVetReviewRequest(int Rating, string? Comment);

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
        string? Phone,
        string? AvailableHours
    );

    public class UploadCredentialsRequest
    {
        public IFormFile File { get; set; } = null!;
    }

    public record UpdateVetAvailabilityRequest(bool IsOnline);
}
