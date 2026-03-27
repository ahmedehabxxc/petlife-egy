using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using petLifeApp.Models;
using Supabase;
using Supabase.Postgrest;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;

namespace petLifeApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VeterinariansController : ControllerBase
    {
        private readonly Supabase.Client _supabase;
        private readonly IConfiguration _config;

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

                var payload = new List<VeterinarianDto>();
                foreach (var vet in vetsResult.Models)
                {
                    var user = await adminClient.From<User>().Where(x => x.UserId == vet.UserId).Single();
                    payload.Add(MapVet(vet, user));
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
                if (vet == null)
                    return NotFound(new { message = "Vet not found." });

                var user = await adminClient.From<User>().Where(x => x.UserId == vet.UserId).Single();
                return Ok(MapVet(vet, user));
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
                return Ok(MapVetProfile(vet, user));
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
                    ClinicAddress = request.ClinicAddress ?? existing.ClinicAddress,
                    University = request.University ?? existing.University,
                    YearsOfExperience = request.YearsOfExperience ?? existing.YearsOfExperience,
                    Bio = request.Bio ?? existing.Bio,
                    ConsultationFee = request.ConsultationFee ?? existing.ConsultationFee,
                    AvatarUrl = request.AvatarUrl ?? existing.AvatarUrl,
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
                return Ok(MapVetProfile(refreshed ?? existing, user));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("credentials")]
        public async Task<IActionResult> UploadCredentials([FromForm] IFormFile file)
        {
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
            var fee = vet.ConsultationFee ?? 150;
            return new VeterinarianDto(
                vet.Id,
                vet.UserId,
                user?.UserName ?? "Veterinarian",
                vet.AvatarUrl,
                vet.Specialization ?? "General Practice",
                vet.ClinicName ?? "Clinic",
                vet.ClinicAddress ?? vet.ClinicLocationUrl ?? "Not set",
                user?.Phone ?? "",
                4.8m,
                0,
                vet.IsVerified ?? false,
                fee,
                vet.ClinicLocationUrl
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
                vet.ClinicAddress ?? vet.ClinicLocationUrl,
                vet.LicenseNumber,
                vet.University,
                vet.YearsOfExperience,
                vet.Bio,
                vet.ConsultationFee ?? 150,
                vet.IsVerified ?? false,
                vet.CredentialsFileName,
                vet.CredentialsContentType
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
        string? ClinicLocationUrl
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
        string? CredentialsContentType
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
}
