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
    public class ConsultationsController : ControllerBase
    {
        private readonly Supabase.Client _supabase;
        private readonly IConfiguration _config;

        public ConsultationsController(Supabase.Client supabase, IConfiguration config)
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

        private IActionResult HandleConsultationException(Exception ex)
        {
            var message = ex.Message ?? "Failed to process consultation request.";

            if (message.Contains("public.ConsultationRequests", StringComparison.OrdinalIgnoreCase) ||
                message.Contains("PGRST205", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new
                {
                    message = "The consultations table is missing in Supabase. Run the SQL in Backend/Database/consultation_requests.sql, then refresh the page."
                });
            }

            return BadRequest(new { message });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateConsultationRequest request)
        {
            try
            {
                if (request == null || request.VetId == Guid.Empty || request.PetId == Guid.Empty)
                    return BadRequest(new { message = "VetId and PetId are required." });

                var adminClient = GetAdminClient();
                var ownerId = await ResolveUserIdAsync(null);
                if (ownerId <= 0)
                    return Unauthorized(new { message = "Missing or invalid Authorization header." });

                var pet = await adminClient.From<Pet>().Where(x => x.Id == request.PetId).Single();
                if (pet == null)
                    return NotFound(new { message = "Pet not found." });

                if (!pet.OwnerId.HasValue || pet.OwnerId.Value != ownerId)
                    return BadRequest(new { message = "You can only request consultations for your own pets." });

                var vet = await adminClient.From<VeterinarianProfileRecord>().Where(x => x.Id == request.VetId).Single();
                if (vet == null)
                    return NotFound(new { message = "Veterinarian not found." });
                if (vet.IsVerified != true)
                    return BadRequest(new { message = "This veterinarian is pending admin approval." });

                var id = Guid.NewGuid();
                var insert = new ConsultationRequestRecord
                {
                    Id = id,
                    PetOwnerId = ownerId,
                    VetId = request.VetId,
                    PetId = request.PetId,
                    Status = "pending",
                    Fee = 150,
                    StartedAt = null,
                    EndedAt = null,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await adminClient.From<ConsultationRequestRecord>().Insert(insert);

                var notification = new NotificationInsert
                {
                    Id = Guid.NewGuid(),
                    UserId = vet.UserId,
                    SenderId = ownerId,
                    Title = "New consultation request",
                    Message = $"New consultation request for {pet.Name ?? "a pet"}.",
                    IsRead = false,
                    ActionUrl = "/vet/consultations",
                    Type = "consultation_request",
                    RelatedId = id,
                    CreatedAt = DateTime.UtcNow
                };
                await adminClient.From<NotificationInsert>().Insert(notification);

                return Ok(new { id });
            }
            catch (Exception ex)
            {
                return HandleConsultationException(ex);
            }
        }

        [HttpGet("for-vet")]
        public async Task<IActionResult> GetForVet([FromQuery] long? userId)
        {
            var resolvedUserId = await ResolveUserIdAsync(userId);
            if (resolvedUserId <= 0)
                return Ok(new List<ConsultationRequestDto>());

            try
            {
                var adminClient = GetAdminClient();
                var vet = await adminClient.From<VeterinarianProfileRecord>().Where(x => x.UserId == resolvedUserId).Single();
                if (vet == null)
                    return Ok(new List<ConsultationRequestDto>());

                var vetUser = await adminClient.From<User>().Where(x => x.UserId == vet.UserId).Single();
                var result = await adminClient.From<ConsultationRequestRecord>().Where(x => x.VetId == vet.Id).Get();
                var payload = new List<ConsultationRequestDto>();

                foreach (var row in result.Models)
                {
                    var owner = await adminClient.From<User>().Where(x => x.UserId == row.PetOwnerId).Single();
                    var pet = await adminClient.From<Pet>().Where(x => x.Id == row.PetId).Single();
                    payload.Add(new ConsultationRequestDto(
                        row.Id,
                        row.PetOwnerId,
                        owner?.UserName ?? "User",
                        null,
                        vet.Id,
                        vet.UserId,
                        vetUser?.UserName ?? "Vet",
                        null,
                        row.PetId,
                        pet?.Name ?? "Pet",
                        pet?.Type ?? "Unknown",
                        row.Fee ?? 150,
                        row.Status ?? "pending",
                        row.CreatedAt,
                        row.StartedAt,
                        row.EndedAt
                    ));
                }

                return Ok(payload.OrderByDescending(p => p.CreatedAt));
            }
            catch (Exception ex)
            {
                return HandleConsultationException(ex);
            }
        }

        [HttpGet("for-owner")]
        public async Task<IActionResult> GetForOwner([FromQuery] long? userId)
        {
            var resolvedUserId = await ResolveUserIdAsync(userId);
            if (resolvedUserId <= 0)
                return Ok(new List<ConsultationRequestDto>());

            try
            {
                var adminClient = GetAdminClient();
                var result = await adminClient.From<ConsultationRequestRecord>().Where(x => x.PetOwnerId == resolvedUserId).Get();
                var payload = new List<ConsultationRequestDto>();

                foreach (var row in result.Models)
                {
                    var vet = await adminClient.From<VeterinarianProfileRecord>().Where(x => x.Id == row.VetId).Single();
                    var vetUser = vet != null ? await adminClient.From<User>().Where(x => x.UserId == vet.UserId).Single() : null;
                    var owner = await adminClient.From<User>().Where(x => x.UserId == row.PetOwnerId).Single();
                    var pet = await adminClient.From<Pet>().Where(x => x.Id == row.PetId).Single();
                    payload.Add(new ConsultationRequestDto(
                        row.Id,
                        row.PetOwnerId,
                        owner?.UserName ?? "User",
                        null,
                        vet?.Id ?? Guid.Empty,
                        vet?.UserId ?? 0,
                        vetUser?.UserName ?? "Vet",
                        null,
                        row.PetId,
                        pet?.Name ?? "Pet",
                        pet?.Type ?? "Unknown",
                        row.Fee ?? 150,
                        row.Status ?? "pending",
                        row.CreatedAt,
                        row.StartedAt,
                        row.EndedAt
                    ));
                }

                return Ok(payload.OrderByDescending(p => p.CreatedAt));
            }
            catch (Exception ex)
            {
                return HandleConsultationException(ex);
            }
        }

        [HttpPost("{id:guid}/accept")]
        public async Task<IActionResult> Accept(Guid id)
        {
            return await UpdateStatus(id, "accepted", "Consultation accepted", "Your consultation request was accepted.");
        }

        [HttpPost("{id:guid}/decline")]
        public async Task<IActionResult> Decline(Guid id)
        {
            return await UpdateStatus(id, "declined", "Consultation declined", "Your consultation request was declined.");
        }

        [HttpPost("{id:guid}/complete")]
        public async Task<IActionResult> Complete(Guid id)
        {
            return await UpdateStatus(id, "completed", "Consultation completed", "Your consultation was marked as completed.");
        }

        [HttpPost("{id:guid}/start")]
        public async Task<IActionResult> Start(Guid id)
        {
            try
            {
                var adminClient = GetAdminClient();
                var resolvedUserId = await ResolveUserIdAsync(null);
                if (resolvedUserId <= 0)
                    return Unauthorized(new { message = "Missing or invalid Authorization header." });

                var existing = await adminClient.From<ConsultationRequestRecord>().Where(x => x.Id == id).Single();
                if (existing == null)
                    return NotFound(new { message = "Consultation request not found." });

                var vet = await adminClient.From<VeterinarianProfileRecord>().Where(x => x.Id == existing.VetId).Single();
                if (vet == null || vet.UserId != resolvedUserId)
                    return Unauthorized(new { message = "You cannot start this consultation." });

                if (!string.Equals(existing.Status, "accepted", StringComparison.OrdinalIgnoreCase))
                    return BadRequest(new { message = "Only accepted consultations can be started." });

                var now = DateTime.UtcNow;
                var update = new ConsultationRequestRecord
                {
                    Id = existing.Id,
                    PetOwnerId = existing.PetOwnerId,
                    VetId = existing.VetId,
                    PetId = existing.PetId,
                    Status = "in_progress",
                    Fee = existing.Fee,
                    StartedAt = existing.StartedAt ?? now,
                    EndedAt = null,
                    CreatedAt = existing.CreatedAt,
                    UpdatedAt = now
                };
                await adminClient.From<ConsultationRequestRecord>().Update(update);

                var notification = new NotificationInsert
                {
                    Id = Guid.NewGuid(),
                    UserId = existing.PetOwnerId,
                    SenderId = vet.UserId,
                    Title = "Consultation started",
                    Message = "Your consultation has started.",
                    IsRead = false,
                    ActionUrl = $"/consultations?conversationId={existing.Id}",
                    Type = "consultation_update",
                    RelatedId = existing.Id,
                    CreatedAt = now
                };
                await adminClient.From<NotificationInsert>().Insert(notification);

                return Ok(new { id, status = "in_progress", startedAt = update.StartedAt });
            }
            catch (Exception ex)
            {
                return HandleConsultationException(ex);
            }
        }

        [HttpPost("{id:guid}/end")]
        public async Task<IActionResult> End(Guid id, [FromBody] EndConsultationRequest? request = null)
        {
            try
            {
                var adminClient = GetAdminClient();
                var resolvedUserId = await ResolveUserIdAsync(null);
                if (resolvedUserId <= 0)
                    return Unauthorized(new { message = "Missing or invalid Authorization header." });

                var existing = await adminClient.From<ConsultationRequestRecord>().Where(x => x.Id == id).Single();
                if (existing == null)
                    return NotFound(new { message = "Consultation request not found." });

                var vet = await adminClient.From<VeterinarianProfileRecord>().Where(x => x.Id == existing.VetId).Single();
                if (vet == null || vet.UserId != resolvedUserId)
                    return Unauthorized(new { message = "You cannot end this consultation." });

                if (!string.Equals(existing.Status, "in_progress", StringComparison.OrdinalIgnoreCase))
                    return BadRequest(new { message = "Only in-progress consultations can be ended." });

                var now = DateTime.UtcNow;
                var startedAt = existing.StartedAt ?? existing.CreatedAt ?? now;
                var update = new ConsultationRequestRecord
                {
                    Id = existing.Id,
                    PetOwnerId = existing.PetOwnerId,
                    VetId = existing.VetId,
                    PetId = existing.PetId,
                    Status = "completed",
                    Fee = existing.Fee,
                    StartedAt = startedAt,
                    EndedAt = now,
                    CreatedAt = existing.CreatedAt,
                    UpdatedAt = now
                };
                await adminClient.From<ConsultationRequestRecord>().Update(update);

                var durationMinutes = Math.Max(0, (int)Math.Round((now - startedAt).TotalMinutes));

                if (request != null &&
                    (!string.IsNullOrWhiteSpace(request.Diagnosis) ||
                     !string.IsNullOrWhiteSpace(request.Treatment) ||
                     !string.IsNullOrWhiteSpace(request.Notes) ||
                     !string.IsNullOrWhiteSpace(request.Prescription) ||
                     request.IncludeChatTranscript))
                {
                    string? chatTranscript = null;
                    if (request.IncludeChatTranscript)
                    {
                        var conversation = await adminClient
                            .From<Notification>()
                            .Where(x => x.ConversationId == existing.Id)
                            .Get();

                        var chatLines = conversation.Models
                            .Where(n => string.Equals(n.Type, "message", StringComparison.OrdinalIgnoreCase))
                            .OrderBy(n => n.CreatedAt)
                            .Select(n =>
                            {
                                var sender = n.SenderId == vet.UserId ? "Vet" : "Pet Owner";
                                return $"{sender}: {n.Message}";
                            });

                        chatTranscript = string.Join(Environment.NewLine, chatLines);
                    }

                    var medicalRecord = new MedicalRecordRecord
                    {
                        Id = Guid.NewGuid(),
                        PetId = existing.PetId,
                        VetId = existing.VetId,
                        ConsultationId = existing.Id,
                        RecordType = "consultation",
                        RecordDate = now,
                        Diagnosis = request.Diagnosis,
                        Treatment = request.Treatment,
                        Notes = request.Notes,
                        Prescription = request.Prescription,
                        ChatTranscript = chatTranscript,
                        CreatedAt = now,
                        UpdatedAt = now
                    };

                    await adminClient.From<MedicalRecordRecord>().Insert(medicalRecord);
                }

                var notification = new NotificationInsert
                {
                    Id = Guid.NewGuid(),
                    UserId = existing.PetOwnerId,
                    SenderId = vet.UserId,
                    Title = "Consultation ended",
                    Message = "Your consultation has ended.",
                    IsRead = false,
                    ActionUrl = $"/consultations?conversationId={existing.Id}",
                    Type = "consultation_update",
                    RelatedId = existing.Id,
                    CreatedAt = now
                };
                await adminClient.From<NotificationInsert>().Insert(notification);

                return Ok(new { id, status = "completed", startedAt = update.StartedAt, endedAt = update.EndedAt, durationMinutes });
            }
            catch (Exception ex)
            {
                return HandleConsultationException(ex);
            }
        }

        private async Task<IActionResult> UpdateStatus(Guid id, string status, string title, string message)
        {
            try
            {
                var adminClient = GetAdminClient();
                var resolvedUserId = await ResolveUserIdAsync(null);
                if (resolvedUserId <= 0)
                    return Unauthorized(new { message = "Missing or invalid Authorization header." });

                var existing = await adminClient.From<ConsultationRequestRecord>().Where(x => x.Id == id).Single();
                if (existing == null)
                    return NotFound(new { message = "Consultation request not found." });

                var vet = await adminClient.From<VeterinarianProfileRecord>().Where(x => x.Id == existing.VetId).Single();
                if (vet == null || vet.UserId != resolvedUserId)
                    return Unauthorized(new { message = "You cannot update this request." });

                if (string.Equals(status, "accepted", StringComparison.OrdinalIgnoreCase) &&
                    !string.Equals(existing.Status, "pending", StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new { message = "Only pending consultations can be accepted." });
                }

                if (string.Equals(status, "declined", StringComparison.OrdinalIgnoreCase) &&
                    !string.Equals(existing.Status, "pending", StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new { message = "Only pending consultations can be declined." });
                }

                if (string.Equals(status, "completed", StringComparison.OrdinalIgnoreCase) &&
                    !string.Equals(existing.Status, "in_progress", StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new { message = "Only in-progress consultations can be completed." });
                }

                var update = new ConsultationRequestRecord
                {
                    Id = existing.Id,
                    PetOwnerId = existing.PetOwnerId,
                    VetId = existing.VetId,
                    PetId = existing.PetId,
                    Status = status,
                    Fee = existing.Fee,
                    StartedAt = existing.StartedAt,
                    EndedAt = string.Equals(status, "completed", StringComparison.OrdinalIgnoreCase)
                        ? (existing.EndedAt ?? DateTime.UtcNow)
                        : existing.EndedAt,
                    CreatedAt = existing.CreatedAt,
                    UpdatedAt = DateTime.UtcNow
                };
                await adminClient.From<ConsultationRequestRecord>().Update(update);

                var notification = new NotificationInsert
                {
                    Id = Guid.NewGuid(),
                    UserId = existing.PetOwnerId,
                    SenderId = vet.UserId,
                    Title = title,
                    Message = message,
                    IsRead = false,
                    ActionUrl = $"/consultations?conversationId={existing.Id}",
                    Type = "consultation_update",
                    RelatedId = existing.Id,
                    CreatedAt = DateTime.UtcNow
                };
                await adminClient.From<NotificationInsert>().Insert(notification);

                return Ok(new { id, status });
            }
            catch (Exception ex)
            {
                return HandleConsultationException(ex);
            }
        }

    }

    public record CreateConsultationRequest(Guid VetId, Guid PetId);

    public record ConsultationRequestDto(
        Guid Id,
        long PetOwnerId,
        string PetOwnerName,
        string? PetOwnerAvatar,
        Guid VetId,
        long VetUserId,
        string VetName,
        string? VetAvatar,
        Guid PetId,
        string PetName,
        string PetSpecies,
        decimal Fee,
        string Status,
        DateTime? CreatedAt,
        DateTime? StartedAt,
        DateTime? EndedAt
    );

    public record EndConsultationRequest(
        string? Diagnosis,
        string? Treatment,
        string? Notes,
        string? Prescription,
        bool IncludeChatTranscript
    );
}
