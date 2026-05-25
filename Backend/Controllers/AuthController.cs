using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Supabase;
using System.IdentityModel.Tokens.Jwt;
using petLifeApp.Models;
using petLifeApp.Services;

namespace petLifeApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly Supabase.Client _supabase;
        private readonly IConfiguration _config;
        private readonly IWebHostEnvironment _env;
        private readonly VetCredentialPersistence _credentialPersistence;
        private readonly SupabaseVetProfileStore _vetProfileStore;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            Supabase.Client supabase,
            IConfiguration config,
            IWebHostEnvironment env,
            VetCredentialPersistence credentialPersistence,
            SupabaseVetProfileStore vetProfileStore,
            ILogger<AuthController> logger)
        {
            _supabase = supabase;
            _config = config;
            _env = env;
            _credentialPersistence = credentialPersistence;
            _vetProfileStore = vetProfileStore;
            _logger = logger;
        }

        private static byte[]? DecodeBase64(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            try
            {
                return Convert.FromBase64String(value);
            }
            catch
            {
                return null;
            }
        }

        private static bool IsDuplicateConstraintError(Exception ex)
        {
            var message = ex.Message ?? string.Empty;
            return message.Contains("23505", StringComparison.OrdinalIgnoreCase)
                   || message.Contains("duplicate key value violates unique constraint", StringComparison.OrdinalIgnoreCase);
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

        private async Task<VeterinarianRestRow?> GetVeterinarianProfileAsync(long? userId)
        {
            if (!userId.HasValue || userId.Value <= 0)
            {
                return null;
            }

            return await _vetProfileStore.GetByUserIdAsync(userId.Value);
        }

        private static string? ResolvePhotoExtension(string? fileName, string? contentType)
        {
            var ext = Path.GetExtension(fileName ?? "");
            if (!string.IsNullOrWhiteSpace(ext))
            {
                return ext;
            }

            return contentType?.ToLowerInvariant() switch
            {
                "image/png" => ".png",
                "image/webp" => ".webp",
                "image/gif" => ".gif",
                _ => ".jpg"
            };
        }

        private async Task<string?> SaveVetProfilePhotoAsync(Guid vetId, byte[] bytes, string? fileName, string? contentType)
        {
            var uploadsDir = Path.Combine(_env.WebRootPath, "uploads", "vets");
            Directory.CreateDirectory(uploadsDir);
            var ext = ResolvePhotoExtension(fileName, contentType);
            var diskName = $"{vetId}{ext}";
            var filePath = Path.Combine(uploadsDir, diskName);
            await System.IO.File.WriteAllBytesAsync(filePath, bytes);
            return $"/uploads/vets/{diskName}";
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
                { "phone", request.Phone ?? "" },
                { "licenseNumber", request.LicenseNumber ?? "" },
                { "specialization", request.Specialization ?? "" },
                { "clinicName", request.ClinicName ?? "" },
                { "university", request.University ?? "" },
                { "yearsOfExperience", request.YearsOfExperience?.ToString() ?? "" },
                { "bio", request.Bio ?? "" },
                { "credentialFileName", request.CredentialFileName ?? "" },
                { "credentialContentType", request.CredentialContentType ?? "" }
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
                Exception? userInsertException = null;
                var adminClient = GetAdminClient();
                try
                {
                    await adminClient.From<UserInsert>().Insert(userInsert);
                }
                catch (Exception insertEx)
                {
                    userInsertException = insertEx;
                }

                try
                {
                    dbUser = await adminClient
                        .From<User>()
                        .Where(x => x.AuthId == authId)
                        .Single();

                    if (dbUser == null)
                    {
                        dbUser = await adminClient
                            .From<User>()
                            .Where(x => x.Email == request.Email)
                            .Single();
                    }
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

                if (dbUser == null)
                {
                    return BadRequest(new
                    {
                        message = "User created in auth but the Users row could not be resolved afterward.",
                        stage = userInsertException == null ? "users_resolve" : "users_insert",
                        details = userInsertException?.Message ?? $"AuthId={authId}; Email={request.Email}"
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
                        var credentialBytes = DecodeBase64(request.CredentialFileBase64);
                        var profilePhotoBytes = DecodeBase64(request.ProfilePhotoBase64);

                        _logger.LogInformation(
                            "Vet registration for user {UserId}: years={Years}, license={License}",
                            dbUser.UserId,
                            request.YearsOfExperience,
                            request.LicenseNumber);

                        string? avatarUrl = null;
                        var vetId = await _vetProfileStore.UpsertVeterinarianRegistrationAsync(
                            new VeterinarianRegistrationData
                            {
                                UserId = dbUser.UserId,
                                LicenseNumber = request.LicenseNumber,
                                Specialization = request.Specialization,
                                ClinicName = request.ClinicName,
                                University = request.University,
                                YearsOfExperience = request.YearsOfExperience,
                                Bio = request.Bio,
                                ConsultationFee = request.ConsultationFee,
                                AvailableHours = request.AvailableHours,
                                ClinicAddress = request.ClinicAddress,
                                IsVerified = false
                            });

                        if (profilePhotoBytes != null && profilePhotoBytes.Length > 0)
                        {
                            avatarUrl = await SaveVetProfilePhotoAsync(
                                vetId,
                                profilePhotoBytes,
                                request.ProfilePhotoFileName,
                                request.ProfilePhotoContentType);
                            await _vetProfileStore.PatchVeterinarianAsync(vetId, new VetProfilePatch
                            {
                                AvatarUrl = avatarUrl
                            });
                        }

                        if (request.YearsOfExperience is int requestedYears)
                        {
                            await _vetProfileStore.EnsureYearsOfExperienceSavedAsync(vetId, requestedYears);
                        }

                        if (!string.IsNullOrWhiteSpace(request.Phone))
                        {
                            await _vetProfileStore.PatchUserPhoneAsync(dbUser.UserId, request.Phone);
                        }

                        if (credentialBytes != null && credentialBytes.Length > 0 &&
                            !string.IsNullOrWhiteSpace(request.CredentialFileName))
                        {
                            try
                            {
                                await _credentialPersistence.SaveAsync(
                                    vetId,
                                    credentialBytes,
                                    request.CredentialFileName,
                                    request.CredentialContentType);
                            }
                            catch (Exception credEx)
                            {
                                _logger.LogWarning(credEx, "Credential save failed for vet {VetId}", vetId);
                            }
                        }
                    }
                    catch (Exception vetEx)
                    {
                        return BadRequest(new
                        {
                            message = "User created in auth but Veterinarians save failed. Check migrations.sql and service role key.",
                            stage = "veterinarians_upsert",
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

                VeterinarianRestRow? vetProfile = null;
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
}
