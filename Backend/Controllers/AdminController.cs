using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using petLifeApp.Models;
<<<<<<< HEAD
using Supabase;
using System.IdentityModel.Tokens.Jwt;
using System.Globalization;
using System.Text;
=======
using petLifeApp.Services;
using Supabase;
using System.IdentityModel.Tokens.Jwt;
using System.Globalization;
>>>>>>> 566e763e4723dcdbb86bc931af1d7ad2ab712daf

namespace petLifeApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly Supabase.Client _supabase;
        private readonly IConfiguration _config;
<<<<<<< HEAD

        public AdminController(Supabase.Client supabase, IConfiguration config)
        {
            _supabase = supabase;
            _config = config;
=======
        private readonly VetCredentialFileService _credentialFiles;
        private readonly SupabaseCredentialStore _credentialStore;
        private readonly VetAuthMetadataService _authMetadata;
        private readonly SupabaseVetProfileStore _vetProfileStore;

        public AdminController(
            Supabase.Client supabase,
            IConfiguration config,
            VetCredentialFileService credentialFiles,
            SupabaseCredentialStore credentialStore,
            VetAuthMetadataService authMetadata,
            SupabaseVetProfileStore vetProfileStore)
        {
            _supabase = supabase;
            _config = config;
            _credentialFiles = credentialFiles;
            _credentialStore = credentialStore;
            _authMetadata = authMetadata;
            _vetProfileStore = vetProfileStore;
>>>>>>> 566e763e4723dcdbb86bc931af1d7ad2ab712daf
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

        private async Task<(bool ok, IActionResult? error, User? user)> RequireAdminAsync()
        {
            var authHeader = Request.Headers.Authorization.FirstOrDefault();
            if (string.IsNullOrWhiteSpace(authHeader) || !authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                return (false, Unauthorized(new { message = "Missing or invalid Authorization header." }), null);
            }

            var token = authHeader.Substring("Bearer ".Length).Trim();
            try
            {
                var handler = new JwtSecurityTokenHandler();
                var jwt = handler.ReadJwtToken(token);
                var sub = jwt.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;
                if (!Guid.TryParse(sub, out var authId))
                {
                    return (false, Unauthorized(new { message = "Invalid auth user id." }), null);
                }

                var adminClient = GetAdminClient();
                var dbUser = await adminClient.From<User>().Where(x => x.AuthId == authId).Single();
                if (dbUser == null)
                {
                    return (false, Unauthorized(new { message = "User record not found." }), null);
                }

                if (!string.Equals(dbUser.Role, "admin", StringComparison.OrdinalIgnoreCase))
                {
                    return (false, Forbid(), null);
                }

                return (true, null, dbUser);
            }
            catch
            {
                return (false, Unauthorized(new { message = "Invalid token." }), null);
            }
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            var auth = await RequireAdminAsync();
            if (!auth.ok) return auth.error!;

            try
            {
                var adminClient = GetAdminClient();
                var users = await adminClient.From<User>().Get();
                var vets = await adminClient.From<VeterinarianProfileRecord>().Get();
                var pets = await adminClient.From<Pet>().Get();
                var orders = await adminClient.From<OrderRecord>().Get();

                var totalUsers = users.Models.Count;
                var verifiedVets = vets.Models.Count(v => v.IsVerified == true);
                var petsRegistered = pets.Models.Count;

                var now = DateTime.UtcNow;
                var ordersThisMonth = orders.Models.Count(o =>
                    o.CreatedAt.HasValue &&
                    o.CreatedAt.Value.Month == now.Month &&
                    o.CreatedAt.Value.Year == now.Year);

                var monthlyUsers = new List<MonthlyCountDto>();
                var revenueData = new List<MonthlyRevenueDto>();
                for (var i = 5; i >= 0; i--)
                {
                    var monthStart = new DateTime(now.Year, now.Month, 1).AddMonths(-i);
                    var monthEnd = monthStart.AddMonths(1);
                    var label = monthStart.ToString("MMM", CultureInfo.InvariantCulture);

                    var monthUserCount = users.Models.Count(u =>
                        u.CreatedAt.HasValue &&
                        u.CreatedAt.Value >= monthStart &&
                        u.CreatedAt.Value < monthEnd);

                    var monthRevenue = orders.Models
                        .Where(o => o.CreatedAt.HasValue &&
                                    o.CreatedAt.Value >= monthStart &&
                                    o.CreatedAt.Value < monthEnd)
                        .Sum(o => o.TotalAmount);

                    monthlyUsers.Add(new MonthlyCountDto(label, monthUserCount));
                    revenueData.Add(new MonthlyRevenueDto(label, monthRevenue));
                }

                var roleDistribution = users.Models
                    .GroupBy(u => string.IsNullOrWhiteSpace(u.Role) ? "pet_owner" : u.Role!)
                    .Select(g => new RoleDistributionDto(RoleLabel(g.Key), g.Count()))
                    .ToList();

                return Ok(new
                {
                    totalUsers,
                    verifiedVets,
                    petsRegistered,
                    ordersThisMonth,
                    monthlyUsers,
                    revenueData,
                    roleDistribution
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            var auth = await RequireAdminAsync();
            if (!auth.ok) return auth.error!;

            try
            {
                var adminClient = GetAdminClient();
                var users = await adminClient.From<User>().Get();

                var payload = users.Models.Select(u => new AdminUserDto(
                    u.UserId,
                    u.UserName ?? u.Email ?? "User",
<<<<<<< HEAD
                    u.Email,
=======
                    u.Email ?? string.Empty,
>>>>>>> 566e763e4723dcdbb86bc931af1d7ad2ab712daf
                    string.IsNullOrWhiteSpace(u.Role) ? "pet_owner" : u.Role!,
                    (u.IsActive ?? true) ? "active" : "suspended",
                    u.CreatedAt
                ));

                return Ok(payload);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("users/{id:long}/status")]
        public async Task<IActionResult> UpdateUserStatus(long id, [FromBody] UpdateUserStatusRequest request)
        {
            var auth = await RequireAdminAsync();
            if (!auth.ok) return auth.error!;

            try
            {
                var adminClient = GetAdminClient();
                var update = new UserStatusUpdate
                {
                    UserId = id,
                    IsActive = request.IsActive
                };

                await adminClient.From<UserStatusUpdate>().Update(update);
                return Ok(new { id, status = request.IsActive ? "active" : "suspended" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("verifications")]
        public async Task<IActionResult> GetVetVerifications()
        {
            var auth = await RequireAdminAsync();
            if (!auth.ok) return auth.error!;

            try
            {
                var adminClient = GetAdminClient();
<<<<<<< HEAD
                var vets = await adminClient.From<VeterinarianProfileRecord>().Get();
                var users = await adminClient.From<User>().Get();
                var userMap = users.Models.ToDictionary(u => u.UserId, u => u);

                var payload = vets.Models.Select(v =>
=======
                var vets = await _vetProfileStore.ListVeterinariansViaRestAsync();
                var users = await adminClient.From<User>().Get();
                var userMap = users.Models.ToDictionary(u => u.UserId, u => u);

                var payload = new List<VetVerificationDto>();
                foreach (var v in vets)
>>>>>>> 566e763e4723dcdbb86bc931af1d7ad2ab712daf
                {
                    userMap.TryGetValue(v.UserId, out var user);
                    var status = v.IsVerified == true ? "approved" : "pending";
                    var docs = string.IsNullOrWhiteSpace(v.CredentialsFileName)
                        ? Array.Empty<string>()
<<<<<<< HEAD
                        : new[] { v.CredentialsFileName };

                    return new VetVerificationDto(
=======
                        : new[] { v.CredentialsFileName! };

                    var years = v.YearsOfExperience ?? 0;
                    var license = v.LicenseNumber ?? "";
                    var specialty = v.Specialization ?? "";
                    var clinic = v.ClinicName ?? "";

                    if (user?.AuthId != null && user.AuthId != Guid.Empty &&
                        (years == 0 || string.IsNullOrWhiteSpace(v.University) || string.IsNullOrWhiteSpace(v.Bio)))
                    {
                        var fromAuth = await _authMetadata.GetMetadataAsync(user.AuthId);
                        if (fromAuth != null)
                        {
                            if (years == 0 && fromAuth.YearsOfExperience is > 0)
                            {
                                years = fromAuth.YearsOfExperience.Value;
                            }

                            if (string.IsNullOrWhiteSpace(license) && !string.IsNullOrWhiteSpace(fromAuth.LicenseNumber))
                            {
                                license = fromAuth.LicenseNumber;
                            }

                            if (string.IsNullOrWhiteSpace(specialty) && !string.IsNullOrWhiteSpace(fromAuth.Specialization))
                            {
                                specialty = fromAuth.Specialization;
                            }

                            if (string.IsNullOrWhiteSpace(clinic) && !string.IsNullOrWhiteSpace(fromAuth.ClinicName))
                            {
                                clinic = fromAuth.ClinicName;
                            }

                            try
                            {
                                await _vetProfileStore.SyncProfileFromAuthAsync(v.Id, fromAuth);
                            }
                            catch
                            {
                                // Display merged values even if DB sync fails.
                            }
                        }
                    }

                    payload.Add(new VetVerificationDto(
>>>>>>> 566e763e4723dcdbb86bc931af1d7ad2ab712daf
                        v.Id,
                        v.UserId,
                        user?.UserName ?? user?.Email ?? "Veterinarian",
                        user?.Email ?? "",
<<<<<<< HEAD
                        v.LicenseNumber ?? "",
                        v.Specialization ?? "",
                        v.ClinicName ?? "",
                        v.YearsOfExperience ?? 0,
                        docs,
                        status,
                        v.CreatedAt,
                        v.UpdatedAt
                    );
                });
=======
                        license,
                        specialty,
                        clinic,
                        years,
                        docs,
                        !string.IsNullOrWhiteSpace(v.CredentialsFileName),
                        v.CredentialsFileName,
                        status,
                        v.CreatedAt,
                        v.UpdatedAt
                    ));
                }
>>>>>>> 566e763e4723dcdbb86bc931af1d7ad2ab712daf

                return Ok(payload);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

<<<<<<< HEAD
        [HttpGet("verifications/{id:guid}")]
        public async Task<IActionResult> GetVetVerificationDetail(Guid id)
=======
        [HttpGet("verifications/{id:guid}/credentials")]
        public async Task<IActionResult> GetVetCredentials(Guid id)
>>>>>>> 566e763e4723dcdbb86bc931af1d7ad2ab712daf
        {
            var auth = await RequireAdminAsync();
            if (!auth.ok) return auth.error!;

            try
            {
                var adminClient = GetAdminClient();
<<<<<<< HEAD
                var vet = await adminClient.From<VeterinarianAdminReviewRecord>().Where(x => x.Id == id).Single();
                if (vet == null)
                {
                    return NotFound(new { message = "Vet not found." });
                }

                var user = await adminClient.From<User>().Where(x => x.UserId == vet.UserId).Single();
                var status = vet.IsVerified == true ? "approved" : "pending";

                return Ok(new VetVerificationDetailDto(
                    vet.Id,
                    vet.UserId,
                    user?.UserName ?? user?.Email ?? "Veterinarian",
                    user?.Email ?? "",
                    user?.Phone,
                    vet.LicenseNumber ?? "",
                    vet.Specialization ?? "",
                    vet.ClinicName ?? "",
                    vet.University,
                    vet.YearsOfExperience,
                    vet.Bio,
                    vet.CredentialsFileName,
                    vet.CredentialsContentType,
                    !string.IsNullOrWhiteSpace(vet.CredentialsFile),
                    status,
                    vet.IsOnline ?? false,
                    vet.CreatedAt,
                    vet.UpdatedAt
                ));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("verifications/{id:guid}/document")]
        public async Task<IActionResult> DownloadVetVerificationDocument(Guid id)
        {
            var auth = await RequireAdminAsync();
            if (!auth.ok) return auth.error!;

            try
            {
                var adminClient = GetAdminClient();
                var vet = await adminClient.From<VeterinarianAdminReviewRecord>().Where(x => x.Id == id).Single();
                if (vet == null)
                {
                    return NotFound(new { message = "Vet not found." });
                }

                if (string.IsNullOrWhiteSpace(vet.CredentialsFile))
                {
                    return NotFound(new { message = "No credentials document uploaded." });
                }

                var fileBytes = DecodeDocumentBytes(vet.CredentialsFile);
                if (fileBytes == null || fileBytes.Length == 0)
                {
                    return BadRequest(new { message = "The stored credentials document could not be decoded." });
                }

                var contentType = string.IsNullOrWhiteSpace(vet.CredentialsContentType)
                    ? "application/octet-stream"
                    : vet.CredentialsContentType;
                var fileName = string.IsNullOrWhiteSpace(vet.CredentialsFileName)
                    ? $"vet-credentials-{id}"
                    : vet.CredentialsFileName;
=======
                var profile = await adminClient.From<VeterinarianProfileRecord>().Where(x => x.Id == id).Single();
                if (profile == null)
                    return NotFound(new { message = "Vet not found." });

                byte[]? fileBytes = null;
                var fileName = profile.CredentialsFileName ?? "credentials";
                var contentType = profile.CredentialsContentType ?? "application/octet-stream";

                var fromDisk = _credentialFiles.TryLoad(
                    id,
                    profile.CredentialsFileName,
                    profile.CredentialsContentType,
                    null);

                if (fromDisk != null)
                {
                    fileBytes = fromDisk.Value.Bytes;
                    fileName = fromDisk.Value.FileName;
                    contentType = fromDisk.Value.ContentType;
                }
                else
                {
                    var fromDb = await _credentialStore.LoadCredentialsAsync(id);
                    if (fromDb != null)
                    {
                        fileBytes = fromDb.Value.Bytes;
                        fileName = fromDb.Value.FileName;
                        contentType = fromDb.Value.ContentType;
                    }
                }

                if (fileBytes == null || fileBytes.Length == 0)
                {
                    return NotFound(new
                    {
                        message = "No credential document on file. The vet may need to re-upload credentials."
                    });
                }

                if (contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
                {
                    Response.Headers.ContentDisposition = $"inline; filename=\"{fileName}\"";
                }
>>>>>>> 566e763e4723dcdbb86bc931af1d7ad2ab712daf

                return File(fileBytes, contentType, fileName);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("verifications/{id:guid}/approve")]
        public async Task<IActionResult> ApproveVet(Guid id)
        {
            var auth = await RequireAdminAsync();
            if (!auth.ok) return auth.error!;

            try
            {
                var adminClient = GetAdminClient();
                var existing = await adminClient.From<VeterinarianProfileRecord>().Where(x => x.Id == id).Single();
                if (existing == null) return NotFound(new { message = "Vet not found." });

<<<<<<< HEAD
                var update = new VeterinarianVerificationUpdate
                {
                    Id = existing.Id,
                    IsVerified = true,
                    UpdatedAt = DateTime.UtcNow
                };
                await adminClient.From<VeterinarianVerificationUpdate>().Update(
                    update,
                    new Supabase.Postgrest.QueryOptions
                    {
                        Returning = Supabase.Postgrest.QueryOptions.ReturnType.Minimal
                    });
=======
                var update = new VeterinarianInsert
                {
                    Id = existing.Id,
                    UserId = existing.UserId,
                    LicenseNumber = existing.LicenseNumber,
                    Specialization = existing.Specialization,
                    ClinicName = existing.ClinicName,
                    IsVerified = true
                };
                await adminClient.From<VeterinarianInsert>().Update(update);
>>>>>>> 566e763e4723dcdbb86bc931af1d7ad2ab712daf
                return Ok(new { id, status = "approved" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("verifications/{id:guid}/reject")]
        public async Task<IActionResult> RejectVet(Guid id)
        {
            var auth = await RequireAdminAsync();
            if (!auth.ok) return auth.error!;

            try
            {
                var adminClient = GetAdminClient();
                var existing = await adminClient.From<VeterinarianProfileRecord>().Where(x => x.Id == id).Single();
                if (existing == null) return NotFound(new { message = "Vet not found." });

<<<<<<< HEAD
                var update = new VeterinarianVerificationUpdate
                {
                    Id = existing.Id,
                    IsVerified = false,
                    UpdatedAt = DateTime.UtcNow
                };
                await adminClient.From<VeterinarianVerificationUpdate>().Update(
                    update,
                    new Supabase.Postgrest.QueryOptions
                    {
                        Returning = Supabase.Postgrest.QueryOptions.ReturnType.Minimal
                    });
=======
                var update = new VeterinarianInsert
                {
                    Id = existing.Id,
                    UserId = existing.UserId,
                    LicenseNumber = existing.LicenseNumber,
                    Specialization = existing.Specialization,
                    ClinicName = existing.ClinicName,
                    IsVerified = false
                };
                await adminClient.From<VeterinarianInsert>().Update(update);
>>>>>>> 566e763e4723dcdbb86bc931af1d7ad2ab712daf
                return Ok(new { id, status = "rejected" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("adoptions")]
        public async Task<IActionResult> GetAdoptionRequests()
        {
            var auth = await RequireAdminAsync();
            if (!auth.ok) return auth.error!;

            try
            {
                var adminClient = GetAdminClient();
                var requests = await adminClient.From<AdoptionRequestRecord>().Get();
                var users = await adminClient.From<User>().Get();
                var pets = await adminClient.From<Pet>().Get();

                var userMap = users.Models.ToDictionary(u => u.UserId, u => u);
                var petMap = pets.Models.ToDictionary(p => p.Id, p => p);

                var payload = requests.Models.Select(r =>
                {
                    var status = r.Status?.ToLowerInvariant() switch
                    {
                        "accepted" => "approved",
                        "declined" => "rejected",
                        _ => "pending"
                    };

                    Pet? pet = null;
                    if (r.PetId.HasValue)
                    {
                        petMap.TryGetValue(r.PetId.Value, out pet);
                    }

                    userMap.TryGetValue(r.ReceiverUserId, out var owner);

                    return new AdoptionListingDto(
                        r.Id,
                        pet?.Name ?? "Pet",
                        pet?.Type ?? "Unknown",
                        pet?.Breed ?? "",
                        owner?.UserName ?? owner?.Email ?? "Owner",
                        pet?.ImageUrl,
                        status,
                        r.CreatedAt
                    );
                });

                return Ok(payload);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("adoptions/{id:guid}/approve")]
        public async Task<IActionResult> ApproveAdoption(Guid id)
        {
            var auth = await RequireAdminAsync();
            if (!auth.ok) return auth.error!;

            try
            {
                var adminClient = GetAdminClient();
                var existing = await adminClient.From<AdoptionRequestRecord>().Where(x => x.Id == id).Single();
                if (existing == null) return NotFound(new { message = "Adoption request not found." });

                var update = new AdoptionRequestRecord
                {
                    Id = existing.Id,
                    SenderUserId = existing.SenderUserId,
                    ReceiverUserId = existing.ReceiverUserId,
                    PetId = existing.PetId,
                    Status = "accepted",
                    CreatedAt = existing.CreatedAt,
                    UpdatedAt = DateTime.UtcNow
                };
                await adminClient.From<AdoptionRequestRecord>().Update(update);

                return Ok(new { id, status = "approved" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("adoptions/{id:guid}/reject")]
        public async Task<IActionResult> RejectAdoption(Guid id)
        {
            var auth = await RequireAdminAsync();
            if (!auth.ok) return auth.error!;

            try
            {
                var adminClient = GetAdminClient();
                var existing = await adminClient.From<AdoptionRequestRecord>().Where(x => x.Id == id).Single();
                if (existing == null) return NotFound(new { message = "Adoption request not found." });

                var update = new AdoptionRequestRecord
                {
                    Id = existing.Id,
                    SenderUserId = existing.SenderUserId,
                    ReceiverUserId = existing.ReceiverUserId,
                    PetId = existing.PetId,
                    Status = "declined",
                    CreatedAt = existing.CreatedAt,
                    UpdatedAt = DateTime.UtcNow
                };
                await adminClient.From<AdoptionRequestRecord>().Update(update);

                return Ok(new { id, status = "rejected" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        private static string RoleLabel(string role)
        {
            return role.ToLowerInvariant() switch
            {
                "veterinarian" => "Veterinarians",
                "shop_owner" => "Shop Owners",
                "admin" => "Admins",
                _ => "Pet Owners"
            };
        }
<<<<<<< HEAD

        private static byte[]? DecodeDocumentBytes(string rawValue)
        {
            if (string.IsNullOrWhiteSpace(rawValue))
            {
                return null;
            }

            var trimmed = rawValue.Trim();
            if (trimmed.StartsWith("\\x", StringComparison.OrdinalIgnoreCase))
            {
                return DecodeHex(trimmed[2..]);
            }

            try
            {
                return Convert.FromBase64String(trimmed);
            }
            catch
            {
                return null;
            }
        }

        private static byte[]? DecodeHex(string hex)
        {
            if (string.IsNullOrWhiteSpace(hex) || hex.Length % 2 != 0)
            {
                return null;
            }

            try
            {
                var bytes = new byte[hex.Length / 2];
                for (var i = 0; i < bytes.Length; i++)
                {
                    bytes[i] = Convert.ToByte(hex.Substring(i * 2, 2), 16);
                }

                return bytes;
            }
            catch
            {
                return null;
            }
        }
=======
>>>>>>> 566e763e4723dcdbb86bc931af1d7ad2ab712daf
    }

    public record MonthlyCountDto(string Month, int Users);
    public record MonthlyRevenueDto(string Month, decimal Revenue);
    public record RoleDistributionDto(string Name, int Value);

    public record AdminUserDto(
        long Id,
        string Name,
        string Email,
        string Role,
        string Status,
        DateTime? Joined
    );

    public record UpdateUserStatusRequest(bool IsActive);

    public record VetVerificationDto(
        Guid Id,
        long UserId,
        string Name,
        string Email,
        string LicenseNumber,
        string Specialty,
        string ClinicName,
        int YearsOfExperience,
        string[] Documents,
<<<<<<< HEAD
=======
        bool HasCredentials,
        string? CredentialFileName,
>>>>>>> 566e763e4723dcdbb86bc931af1d7ad2ab712daf
        string Status,
        DateTime? SubmittedAt,
        DateTime? ReviewedAt
    );

<<<<<<< HEAD
    public record VetVerificationDetailDto(
        Guid Id,
        long UserId,
        string Name,
        string Email,
        string? Phone,
        string LicenseNumber,
        string Specialty,
        string ClinicName,
        string? University,
        int? YearsOfExperience,
        string? Bio,
        string? CredentialsFileName,
        string? CredentialsContentType,
        bool HasDocument,
        string Status,
        bool IsOnline,
        DateTime? SubmittedAt,
        DateTime? ReviewedAt
    );

=======
>>>>>>> 566e763e4723dcdbb86bc931af1d7ad2ab712daf
    public record AdoptionListingDto(
        Guid Id,
        string PetName,
        string Species,
        string Breed,
        string OwnerName,
        string? Photo,
        string Status,
        DateTime? ListedAt
    );
}
