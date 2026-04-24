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
    public class AdoptionRequestsController : ControllerBase
    {
        private readonly Supabase.Client _supabase;
        private readonly IConfiguration _config;

        public AdoptionRequestsController(Supabase.Client supabase, IConfiguration config)
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

        [HttpGet("received")]
        public async Task<IActionResult> GetReceived([FromQuery] long? userId)
        {
            var resolvedUserId = await ResolveUserIdAsync(userId);
            if (resolvedUserId <= 0)
                return Ok(new List<AdoptionRequestDto>());

            try
            {
                var adminClient = GetAdminClient();
                var result = await adminClient
                    .From<AdoptionRequestRecord>()
                    .Where(x => x.ReceiverUserId == resolvedUserId)
                    .Get();

                var rows = result.Models;
                var payload = new List<AdoptionRequestDto>();

                foreach (var row in rows)
                {
                    var sender = await adminClient.From<User>().Where(x => x.UserId == row.SenderUserId).Single();
                    Pet? pet = null;
                    if (row.PetId.HasValue)
                    {
                        pet = await adminClient.From<Pet>().Where(x => x.Id == row.PetId.Value).Single();
                    }

                    payload.Add(new AdoptionRequestDto(
                        row.Id,
                        row.SenderUserId,
                        row.ReceiverUserId,
                        row.PetId,
                        sender?.UserName ?? "User",
                        pet?.Name ?? "Pet",
                        pet?.ImageUrl,
                        row.Status ?? "pending",
                        row.CreatedAt
                    ));
                }

                return Ok(payload.OrderByDescending(p => p.CreatedAt));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id:guid}/accept")]
        public async Task<IActionResult> Accept(Guid id)
        {
            try
            {
                var adminClient = GetAdminClient();
                var resolvedUserId = await ResolveUserIdAsync(null);
                if (resolvedUserId <= 0)
                {
                    return Unauthorized(new { message = "Missing or invalid Authorization header." });
                }

                var existing = await adminClient
                    .From<AdoptionRequestRecord>()
                    .Where(x => x.Id == id)
                    .Single();

                if (existing == null)
                    return NotFound(new { message = "Adoption request not found." });

                if (existing.ReceiverUserId != resolvedUserId)
                    return Unauthorized(new { message = "You cannot update this request." });

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

                var notification = new NotificationInsert
                {
                    Id = Guid.NewGuid(),
                    UserId = existing.SenderUserId,
                    SenderId = existing.ReceiverUserId,
                    Title = "Adoption request accepted",
                    Message = "Your adoption request was accepted.",
                    IsRead = false,
                    ActionUrl = $"/matching?conversationId={id}",
                    Type = "adoption_accepted",
                    RelatedId = id,
                    CreatedAt = DateTime.UtcNow
                };
                await adminClient.From<NotificationInsert>().Insert(notification);

                return Ok(new { id, status = "accepted" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id:guid}/decline")]
        public async Task<IActionResult> Decline(Guid id)
        {
            try
            {
                var adminClient = GetAdminClient();
                var resolvedUserId = await ResolveUserIdAsync(null);
                if (resolvedUserId <= 0)
                {
                    return Unauthorized(new { message = "Missing or invalid Authorization header." });
                }

                var existing = await adminClient
                    .From<AdoptionRequestRecord>()
                    .Where(x => x.Id == id)
                    .Single();

                if (existing == null)
                    return NotFound(new { message = "Adoption request not found." });

                if (existing.ReceiverUserId != resolvedUserId)
                    return Unauthorized(new { message = "You cannot update this request." });

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

                var notification = new NotificationInsert
                {
                    Id = Guid.NewGuid(),
                    UserId = existing.SenderUserId,
                    SenderId = existing.ReceiverUserId,
                    Title = "Adoption request declined",
                    Message = "Your adoption request was declined.",
                    IsRead = false,
                    ActionUrl = "/matching?tab=adoption",
                    Type = "adoption_declined",
                    RelatedId = id,
                    CreatedAt = DateTime.UtcNow
                };
                await adminClient.From<NotificationInsert>().Insert(notification);

                return Ok(new { id, status = "declined" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("chats")]
        public async Task<IActionResult> GetChats([FromQuery] long? userId)
        {
            var resolvedUserId = await ResolveUserIdAsync(userId);
            if (resolvedUserId <= 0)
                return Ok(new List<AdoptionChatDto>());

            try
            {
                var adminClient = GetAdminClient();
                var result = await adminClient
                    .From<AdoptionRequestRecord>()
                    .Get();

                var rows = result.Models
                    .Where(r => string.Equals(r.Status, "accepted", StringComparison.OrdinalIgnoreCase) &&
                                (r.SenderUserId == resolvedUserId || r.ReceiverUserId == resolvedUserId))
                    .ToList();

                var payload = new List<AdoptionChatDto>();

                foreach (var row in rows)
                {
                    var otherUserId = row.SenderUserId == resolvedUserId ? row.ReceiverUserId : row.SenderUserId;
                    var otherUser = await adminClient.From<User>().Where(x => x.UserId == otherUserId).Single();
                    Pet? pet = null;
                    if (row.PetId.HasValue)
                    {
                        pet = await adminClient.From<Pet>().Where(x => x.Id == row.PetId.Value).Single();
                    }

                    payload.Add(new AdoptionChatDto(
                        row.Id,
                        otherUserId,
                        otherUser?.UserName ?? "User",
                        pet?.Name ?? "Pet",
                        pet?.ImageUrl
                    ));
                }

                return Ok(payload);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id, [FromQuery] long? userId)
        {
            var resolvedUserId = await ResolveUserIdAsync(userId);
            if (resolvedUserId <= 0)
                return Unauthorized(new { message = "Missing or invalid Authorization header." });

            try
            {
                var adminClient = GetAdminClient();
                var existing = await adminClient
                    .From<AdoptionRequestRecord>()
                    .Where(x => x.Id == id)
                    .Single();

                if (existing == null)
                    return NotFound(new { message = "Adoption request not found." });

                if (existing.SenderUserId != resolvedUserId && existing.ReceiverUserId != resolvedUserId)
                    return Unauthorized(new { message = "You cannot access this request." });

                var otherUserId = existing.SenderUserId == resolvedUserId ? existing.ReceiverUserId : existing.SenderUserId;
                var otherUser = await adminClient.From<User>().Where(x => x.UserId == otherUserId).Single();
                Pet? pet = null;
                if (existing.PetId.HasValue)
                {
                    pet = await adminClient.From<Pet>().Where(x => x.Id == existing.PetId.Value).Single();
                }

                return Ok(new AdoptionChatDto(
                    existing.Id,
                    otherUserId,
                    otherUser?.UserName ?? "User",
                    pet?.Name ?? "Pet",
                    pet?.ImageUrl
                ));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }

    public record AdoptionRequestDto(
        Guid Id,
        long SenderUserId,
        long ReceiverUserId,
        Guid? PetId,
        string SenderName,
        string PetName,
        string? PetPhoto,
        string Status,
        DateTime? CreatedAt
    );

    public record AdoptionChatDto(
        Guid ConversationId,
        long OtherUserId,
        string OtherUserName,
        string PetName,
        string? PetPhoto
    );
}
