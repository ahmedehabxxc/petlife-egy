using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using petLifeApp.Models;
using Supabase;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;

namespace petLifeApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MedicalRecordsController : ControllerBase
    {
        private readonly Supabase.Client _supabase;
        private readonly IConfiguration _config;

        public MedicalRecordsController(Supabase.Client supabase, IConfiguration config)
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

        [HttpGet("for-vet")]
        public async Task<IActionResult> GetForVet([FromQuery] long? userId)
        {
            var resolvedUserId = await ResolveUserIdAsync(userId);
            if (resolvedUserId <= 0)
                return Ok(new List<MedicalRecordDto>());

            try
            {
                var adminClient = GetAdminClient();
                var vet = await adminClient.From<VeterinarianProfileRecord>().Where(x => x.UserId == resolvedUserId).Single();
                if (vet == null)
                    return Ok(new List<MedicalRecordDto>());

                var records = await adminClient.From<MedicalRecordRecord>().Where(x => x.VetId == vet.Id).Get();
                var payload = new List<MedicalRecordDto>();
                var vetUser = await adminClient.From<User>().Where(x => x.UserId == vet.UserId).Single();
                var vetName = vetUser?.UserName ?? "Vet";

                foreach (var record in records.Models)
                {
                    payload.Add(new MedicalRecordDto(
                        record.Id,
                        record.PetId ?? Guid.Empty,
                        vet.Id,
                        vetName,
                        (record.RecordDate ?? record.CreatedAt ?? DateTime.UtcNow).ToString("yyyy-MM-dd"),
                        record.Diagnosis ?? "",
                        record.Treatment ?? "",
                        record.Notes
                    ));
                }

                return Ok(payload.OrderByDescending(p => p.Date));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateMedicalRecordRequest request)
        {
            try
            {
                if (request.PetId == Guid.Empty)
                    return BadRequest(new { message = "PetId is required." });

                var adminClient = GetAdminClient();
                var resolvedUserId = await ResolveUserIdAsync(null);
                if (resolvedUserId <= 0)
                    return Unauthorized(new { message = "Missing or invalid Authorization header." });

                var vet = await adminClient.From<VeterinarianProfileRecord>().Where(x => x.UserId == resolvedUserId).Single();
                if (vet == null)
                    return BadRequest(new { message = "Vet profile not found." });

                var record = new MedicalRecordRecord
                {
                    Id = Guid.NewGuid(),
                    PetId = request.PetId,
                    VetId = vet.Id,
                    RecordDate = DateTime.UtcNow,
                    Diagnosis = request.Diagnosis,
                    Treatment = request.Treatment,
                    Notes = request.Notes
                };

                await adminClient.From<MedicalRecordRecord>().Insert(record);
                return Ok(new { id = record.Id });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateMedicalRecordRequest request)
        {
            try
            {
                var adminClient = GetAdminClient();
                var resolvedUserId = await ResolveUserIdAsync(null);
                if (resolvedUserId <= 0)
                    return Unauthorized(new { message = "Missing or invalid Authorization header." });

                var vet = await adminClient.From<VeterinarianProfileRecord>().Where(x => x.UserId == resolvedUserId).Single();
                if (vet == null)
                    return BadRequest(new { message = "Vet profile not found." });

                var existing = await adminClient.From<MedicalRecordRecord>().Where(x => x.Id == id).Single();
                if (existing == null || existing.VetId != vet.Id)
                    return Unauthorized(new { message = "You cannot edit this record." });

                var update = new MedicalRecordRecord
                {
                    Id = existing.Id,
                    PetId = existing.PetId,
                    VetId = existing.VetId,
                    RecordDate = existing.RecordDate,
                    Diagnosis = request.Diagnosis ?? existing.Diagnosis,
                    Treatment = request.Treatment ?? existing.Treatment,
                    Notes = request.Notes ?? existing.Notes,
                    AttachmentUrl = existing.AttachmentUrl,
                    CreatedAt = existing.CreatedAt,
                    UpdatedAt = DateTime.UtcNow
                };

                await adminClient.From<MedicalRecordRecord>().Update(update);
                return Ok(new { id });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }

    public record CreateMedicalRecordRequest(
        Guid PetId,
        string Diagnosis,
        string Treatment,
        string? Notes
    );

    public record UpdateMedicalRecordRequest(
        string? Diagnosis,
        string? Treatment,
        string? Notes
    );

    public record MedicalRecordDto(
        Guid Id,
        Guid PetId,
        Guid VetId,
        string VetName,
        string Date,
        string Diagnosis,
        string Treatment,
        string? Notes
    );
}
