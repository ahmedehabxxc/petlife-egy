using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Supabase;
using System.IdentityModel.Tokens.Jwt;
using petLifeApp.Models;

namespace petLifeApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly Supabase.Client _supabase;
        private readonly IConfiguration _config;

        public AuthController(Supabase.Client supabase, IConfiguration config)
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

            // Fallback to the injected client (anon key) if no service role key is configured.
            return _supabase;
        }

        private async Task<VeterinarianProfileRecord?> GetVeterinarianProfileAsync(long? userId)
        {
            if (!userId.HasValue || userId.Value <= 0)
            {
                return null;
            }

            var adminClient = GetAdminClient();
            return await adminClient
                .From<VeterinarianProfileRecord>()
                .Where(x => x.UserId == userId.Value)
                .Single();
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] AuthRegisterRequest request)
        {
            try
            {
                var role = string.IsNullOrWhiteSpace(request.Role) ? "pet_owner" : request.Role;
                var fullName = request.FirstName ?? string.Empty;
                if (!string.IsNullOrWhiteSpace(request.LastName))
                {
                    fullName = $"{fullName} {request.LastName}";
                }
                fullName = fullName.Trim();

                var options = new Supabase.Gotrue.SignUpOptions
                {
                    Data = new Dictionary<string, object>
            {
                { "username", fullName },
                { "role", role },
                { "phone", request.Phone ?? "" }
            }
                };

                var session = await _supabase.Auth.SignUp(request.Email, request.Password, options);

                if (session?.User == null)
                    return BadRequest(new { message = "Auth signup failed." });

                if (!Guid.TryParse(session.User.Id, out var authId))
                    return BadRequest(new { message = "Invalid auth user id." });

                var userInsert = new UserInsert
                {
                    AuthId = authId,
                    UserName = string.IsNullOrWhiteSpace(fullName) ? null : fullName,
                    Email = request.Email,
                    Phone = request.Phone,
                    Role = role
                };

                User? dbUser;
                var adminClient = GetAdminClient();
                try
                {
                    await adminClient.From<UserInsert>().Insert(userInsert);
                }
                catch (Exception insertEx)
                {
                    return BadRequest(new
                    {
                        message = "User created in auth but Users insert failed. Check RLS and service role key.",
                        stage = "users_insert",
                        details = insertEx.Message
                    });
                }

                try
                {
                    dbUser = await adminClient
                        .From<User>()
                        .Where(x => x.AuthId == authId)
                        .Single();
                }
                catch (Exception readEx)
                {
                    return BadRequest(new
                    {
                        message = "User created in auth but Users read failed.",
                        stage = "users_read",
                        details = readEx.Message
                    });
                }

                if (dbUser != null && string.Equals(role, "shop_owner", StringComparison.OrdinalIgnoreCase))
                {
                    try
                    {
                        var existingOwner = await adminClient
                            .From<ShopOwnerRecord>()
                            .Where(x => x.UserId == dbUser.UserId)
                            .Get();

                        if (existingOwner.Models.Count == 0)
                        {
                            var shopName = dbUser.UserName ?? dbUser.Email ?? "Shop";
                            var ownerInsert = new ShopOwnerRecord
                            {
                                Id = Guid.NewGuid(),
                                UserId = dbUser.UserId,
                                ShopName = shopName
                            };
                            await adminClient.From<ShopOwnerRecord>().Insert(ownerInsert);
                        }
                    }
                    catch (Exception ownerEx)
                    {
                        return BadRequest(new
                        {
                            message = "User created in auth but ShopOwner insert failed.",
                            stage = "shop_owner_insert",
                            details = ownerEx.Message
                        });
                    }
                }

                if (dbUser != null && string.Equals(role, "veterinarian", StringComparison.OrdinalIgnoreCase))
                {
                    try
                    {
                        var existingVet = await adminClient
                            .From<VeterinarianProfileRecord>()
                            .Where(x => x.UserId == dbUser.UserId)
                            .Get();

                        if (existingVet.Models.Count == 0)
                        {
                            var vetInsert = new VeterinarianInsert
                            {
                                Id = Guid.NewGuid(),
                                UserId = dbUser.UserId,
                                LicenseNumber = request.LicenseNumber,
                                Specialization = request.Specialization,
                                ClinicName = request.ClinicName,
                                IsVerified = false
                            };

                            await adminClient.From<VeterinarianInsert>().Insert(vetInsert);

                            var extrasInsert = new VeterinarianExtrasUpdate
                            {
                                Id = vetInsert.Id,
                                University = request.University,
                                YearsOfExperience = request.YearsOfExperience,
                                Bio = request.Bio,
                                ConsultationFee = request.ConsultationFee,
                                UpdatedAt = DateTime.UtcNow
                            };

                            try
                            {
                                await adminClient.From<VeterinarianExtrasUpdate>().Update(extrasInsert);
                            }
                            catch
                            {
                                // Ignore optional columns that may not exist yet.
                            }
                        }
                        else
                        {
                            var vetId = existingVet.Models[0].Id;
                            var vetBaseUpdate = new VeterinarianInsert
                            {
                                Id = vetId,
                                UserId = dbUser.UserId,
                                LicenseNumber = request.LicenseNumber,
                                Specialization = request.Specialization,
                                ClinicName = request.ClinicName,
                                IsVerified = existingVet.Models[0].IsVerified
                            };

                            await adminClient.From<VeterinarianInsert>().Update(vetBaseUpdate);

                            var extrasUpdate = new VeterinarianExtrasUpdate
                            {
                                Id = vetId,
                                University = request.University,
                                YearsOfExperience = request.YearsOfExperience,
                                Bio = request.Bio,
                                ConsultationFee = request.ConsultationFee,
                                UpdatedAt = DateTime.UtcNow
                            };

                            try
                            {
                                await adminClient.From<VeterinarianExtrasUpdate>().Update(extrasUpdate);
                            }
                            catch
                            {
                                // Ignore optional columns that may not exist yet.
                            }
                        }
                    }
                    catch (Exception vetEx)
                    {
                        return BadRequest(new
                        {
                            message = "User created in auth but Veterinarians insert failed. Check RLS and service role key.",
                            stage = "veterinarians_insert",
                            details = vetEx.Message
                        });
                    }
                }

                var vetProfile = string.Equals(role, "veterinarian", StringComparison.OrdinalIgnoreCase)
                    ? await GetVeterinarianProfileAsync(dbUser?.UserId)
                    : null;
                var token = session.AccessToken ?? session.RefreshToken ?? "";
                var status = string.Equals(role, "veterinarian", StringComparison.OrdinalIgnoreCase)
                    ? (vetProfile?.IsVerified == true ? "active" : "pending_approval")
                    : "active";

                return Ok(new
                {
                    authId,
                    userId = dbUser?.UserId,
                    email = request.Email,
                    name = string.IsNullOrWhiteSpace(fullName) ? request.Email : fullName,
                    role,
                    status,
                    confirmationRequired = string.IsNullOrEmpty(token),
                    token
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] AuthLoginRequest request)
        {
            try
            {
                var session = await _supabase.Auth.SignIn(request.Email, request.Password);
                if (session?.User == null)
                    return Unauthorized(new { message = "Invalid credentials." });

                if (!Guid.TryParse(session.User.Id, out var authId))
                    return Unauthorized(new { message = "Invalid auth user id." });
                var adminClient = GetAdminClient();
                var dbUser = await adminClient
                    .From<User>()
                    .Where(x => x.AuthId == authId)
                    .Single();

                if (dbUser == null)
                    return Unauthorized(new
                    {
                        message = "User record not found. Check RLS policies or ensure the Users.AuthId matches auth.users id."
                    });

                VeterinarianProfileRecord? vetProfile = null;
                if (string.Equals(dbUser.Role, "veterinarian", StringComparison.OrdinalIgnoreCase))
                {
                    vetProfile = await GetVeterinarianProfileAsync(dbUser.UserId);
                    if (vetProfile?.IsVerified != true)
                    {
                        return StatusCode(StatusCodes.Status403Forbidden, new
                        {
                            message = "Your veterinarian account is pending admin approval.",
                            status = "pending_approval"
                        });
                    }
                }

                var token = session.AccessToken ?? session.RefreshToken ?? string.Empty;
                return Ok(new
                {
                    authId = dbUser.AuthId,
                    userId = dbUser.UserId,
                    email = dbUser.Email,
                    role = dbUser.Role ?? "pet_owner",
                    status = vetProfile?.IsVerified == true ? "active" : "active",
                    token,
                    name = dbUser.UserName ?? dbUser.Email
                });
            }
            catch (Exception ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            var authHeader = Request.Headers.Authorization.FirstOrDefault();
            if (string.IsNullOrWhiteSpace(authHeader) || !authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                return Unauthorized(new { message = "Missing or invalid Authorization header." });
            }

            var token = authHeader.Substring("Bearer ".Length).Trim();
            try
            {
                var handler = new JwtSecurityTokenHandler();
                var jwt = handler.ReadJwtToken(token);
                var sub = jwt.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;
                if (!Guid.TryParse(sub, out var authId))
                {
                    return Unauthorized(new { message = "Invalid auth user id." });
                }

                var adminClient = GetAdminClient();
                var dbUser = await adminClient
                    .From<User>()
                    .Where(x => x.AuthId == authId)
                    .Single();

                if (dbUser == null)
                {
                    return Unauthorized(new { message = "User record not found." });
                }

                var vetProfile = string.Equals(dbUser.Role, "veterinarian", StringComparison.OrdinalIgnoreCase)
                    ? await GetVeterinarianProfileAsync(dbUser.UserId)
                    : null;
                var status = string.Equals(dbUser.Role, "veterinarian", StringComparison.OrdinalIgnoreCase)
                    ? (vetProfile?.IsVerified == true ? "active" : "pending_approval")
                    : "active";

                if (string.Equals(status, "pending_approval", StringComparison.OrdinalIgnoreCase))
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new
                    {
                        message = "Your veterinarian account is pending admin approval.",
                        status
                    });
                }

                return Ok(new
                {
                    authId = dbUser.AuthId,
                    userId = dbUser.UserId,
                    email = dbUser.Email,
                    role = dbUser.Role ?? "pet_owner",
                    status,
                    name = dbUser.UserName ?? dbUser.Email
                });
            }
            catch (Exception ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }
    }

    public record AuthRegisterRequest(
        string Email,
        string Password,
        string FirstName,
        string? LastName,
        string? Phone,
        string? Role,
        string? LicenseNumber,
        string? Specialization,
        string? ClinicName,
        string? University,
        int? YearsOfExperience,
        string? Bio,
        decimal? ConsultationFee
    );

    public record AuthLoginRequest(string Email, string Password);
}
