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
                        record.RecordType ?? "consultation",
                        record.Diagnosis ?? "",
                        record.Treatment ?? "",
                        record.Notes,
                        record.Prescription,
                        record.ConsultationId,
                        record.VaccineName,
                        record.NextDueDate?.ToString("yyyy-MM-dd")
                    ));
                }

                return Ok(payload.OrderByDescending(p => p.Date));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("history/{petId:guid}")]
        public async Task<IActionResult> GetPetHistory(Guid petId, [FromQuery] long? userId)
        {
            var resolvedUserId = await ResolveUserIdAsync(userId);
            if (resolvedUserId <= 0)
                return Ok(new PetMedicalHistoryDto(petId, new List<MedicalRecordDto>(), new List<VaccinationLogDto>()));

            try
            {
                var adminClient = GetAdminClient();
                var vet = await adminClient.From<VeterinarianProfileRecord>().Where(x => x.UserId == resolvedUserId).Single();
                if (vet == null)
                    return Unauthorized(new { message = "Vet profile not found." });

                var records = await adminClient.From<MedicalRecordRecord>().Where(x => x.PetId == petId).Get();
                var vetIds = records.Models.Where(r => r.VetId.HasValue).Select(r => r.VetId!.Value).Distinct().ToList();
                var vets = await adminClient.From<VeterinarianProfileRecord>().Get();
                var users = await adminClient.From<User>().Get();
                var vetUserMap = vets.Models
                    .Where(v => vetIds.Contains(v.Id))
                    .Join(users.Models, v => v.UserId, u => u.UserId, (v, u) => new { v.Id, Name = u.UserName ?? u.Email ?? "Vet" })
                    .ToDictionary(x => x.Id, x => x.Name);

                var history = records.Models
                    .OrderByDescending(r => r.RecordDate ?? r.CreatedAt)
                    .Select(record => new MedicalRecordDto(
                        record.Id,
                        record.PetId ?? Guid.Empty,
                        record.VetId ?? Guid.Empty,
                        record.VetId.HasValue && vetUserMap.TryGetValue(record.VetId.Value, out var vetName) ? vetName : "Vet",
                        (record.RecordDate ?? record.CreatedAt ?? DateTime.UtcNow).ToString("yyyy-MM-dd"),
                        record.RecordType ?? "consultation",
                        record.Diagnosis ?? "",
                        record.Treatment ?? "",
                        record.Notes,
                        record.Prescription,
                        record.ConsultationId,
                        record.VaccineName,
                        record.NextDueDate?.ToString("yyyy-MM-dd")
                    ))
                    .ToList();

                var vaccinations = history
                    .Where(r => string.Equals(r.RecordType, "vaccination", StringComparison.OrdinalIgnoreCase))
                    .Select(r => new VaccinationLogDto(
                        r.Id,
                        r.PetId,
                        r.VaccineName ?? r.Diagnosis,
                        r.Date,
                        r.NextDueDate,
                        r.Notes
                    ))
                    .ToList();

                return Ok(new PetMedicalHistoryDto(petId, history, vaccinations));
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
                    RecordType = string.IsNullOrWhiteSpace(request.RecordType) ? "consultation" : request.RecordType,
                    ConsultationId = request.ConsultationId,
                    Diagnosis = request.Diagnosis,
                    Treatment = request.Treatment,
                    Notes = request.Notes,
                    Prescription = request.Prescription,
                    VaccineName = request.VaccineName,
                    NextDueDate = request.NextDueDate
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
                    RecordType = request.RecordType ?? existing.RecordType,
                    ConsultationId = request.ConsultationId ?? existing.ConsultationId,
                    Diagnosis = request.Diagnosis ?? existing.Diagnosis,
                    Treatment = request.Treatment ?? existing.Treatment,
                    Notes = request.Notes ?? existing.Notes,
                    Prescription = request.Prescription ?? existing.Prescription,
                    ChatTranscript = request.ChatTranscript ?? existing.ChatTranscript,
                    VaccineName = request.VaccineName ?? existing.VaccineName,
                    NextDueDate = request.NextDueDate ?? existing.NextDueDate,
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

        [HttpPost("vaccinations")]
        public async Task<IActionResult> AddVaccination([FromBody] CreateVaccinationLogRequest request)
        {
            try
            {
                if (request.PetId == Guid.Empty || string.IsNullOrWhiteSpace(request.VaccineName))
                    return BadRequest(new { message = "PetId and vaccine name are required." });

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
                    RecordDate = request.Date ?? DateTime.UtcNow,
                    RecordType = "vaccination",
                    Diagnosis = request.VaccineName,
                    Notes = request.Notes,
                    VaccineName = request.VaccineName,
                    NextDueDate = request.NextDueDate
                };

                await adminClient.From<MedicalRecordRecord>().Insert(record);
                return Ok(new VaccinationLogDto(
                    record.Id,
                    request.PetId,
                    request.VaccineName,
                    (record.RecordDate ?? DateTime.UtcNow).ToString("yyyy-MM-dd"),
                    request.NextDueDate?.ToString("yyyy-MM-dd"),
                    request.Notes
                ));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("vaccinations/{petId:guid}")]
        public async Task<IActionResult> GetVaccinations(Guid petId, [FromQuery] long? userId)
        {
            var resolvedUserId = await ResolveUserIdAsync(userId);
            if (resolvedUserId <= 0)
                return Ok(new List<VaccinationLogDto>());

            try
            {
                var adminClient = GetAdminClient();
                var vet = await adminClient.From<VeterinarianProfileRecord>().Where(x => x.UserId == resolvedUserId).Single();
                if (vet == null)
                    return Unauthorized(new { message = "Vet profile not found." });

                var records = await adminClient.From<MedicalRecordRecord>().Where(x => x.PetId == petId).Get();
                var payload = records.Models
                    .Where(r => string.Equals(r.RecordType, "vaccination", StringComparison.OrdinalIgnoreCase))
                    .OrderByDescending(r => r.RecordDate ?? r.CreatedAt)
                    .Select(r => new VaccinationLogDto(
                        r.Id,
                        r.PetId ?? Guid.Empty,
                        r.VaccineName ?? r.Diagnosis ?? "Vaccination",
                        (r.RecordDate ?? r.CreatedAt ?? DateTime.UtcNow).ToString("yyyy-MM-dd"),
                        r.NextDueDate?.ToString("yyyy-MM-dd"),
                        r.Notes
                    ))
                    .ToList();

                return Ok(payload);
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
        string? Notes,
        string? RecordType = null,
        Guid? ConsultationId = null,
        string? Prescription = null,
        string? VaccineName = null,
        DateTime? NextDueDate = null
    );

    public record UpdateMedicalRecordRequest(
        string? Diagnosis,
        string? Treatment,
        string? Notes,
        string? RecordType = null,
        Guid? ConsultationId = null,
        string? Prescription = null,
        string? ChatTranscript = null,
        string? VaccineName = null,
        DateTime? NextDueDate = null
    );

    public record MedicalRecordDto(
        Guid Id,
        Guid PetId,
        Guid VetId,
        string VetName,
        string Date,
        string RecordType,
        string Diagnosis,
        string Treatment,
        string? Notes,
        string? Prescription,
        Guid? ConsultationId,
        string? VaccineName,
        string? NextDueDate
    );

    public record CreateVaccinationLogRequest(
        Guid PetId,
        string VaccineName,
        DateTime? Date,
        DateTime? NextDueDate,
        string? Notes
    );

    public record VaccinationLogDto(
        Guid Id,
        Guid PetId,
        string VaccineName,
        string Date,
        string? NextDueDate,
        string? Notes
    );

    public record PetMedicalHistoryDto(
        Guid PetId,
        List<MedicalRecordDto> Records,
        List<VaccinationLogDto> Vaccinations
    );
}
