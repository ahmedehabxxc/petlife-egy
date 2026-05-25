using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using petLifeApp.Models;
using Supabase;
using System.Linq;

namespace petLifeApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PetsController : ControllerBase
    {
        private readonly Supabase.Client _supabase;
        private readonly IConfiguration _config;

        public PetsController(Supabase.Client supabase, IConfiguration config)
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

        [HttpGet]
        public async Task<IActionResult> GetByOwner([FromQuery] long? ownerId)
        {
            if (!ownerId.HasValue || ownerId.Value <= 0)
                return Ok(new List<Pet>());

            try
            {
                var adminClient = GetAdminClient();
                var result = await adminClient
                    .From<Pet>()
                    .Where(x => x.OwnerId == ownerId.Value)
                    .Get();

                var payload = result.Models.Select(MapPet).ToList();
                return Ok(payload);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("browse")]
        public async Task<IActionResult> Browse()
        {
            try
            {
                var adminClient = GetAdminClient();
                var result = await adminClient
                    .From<Pet>()
                    .Get();

                var payload = result.Models.Select(MapPet).ToList();
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
                var result = await adminClient
                    .From<Pet>()
                    .Where(x => x.Id == id)
                    .Single();

                if (result == null)
                    return NotFound(new { message = "Pet not found." });

                return Ok(MapPet(result));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreatePetRequest request)
        {
            try
            {
                if (!request.OwnerId.HasValue || request.OwnerId.Value <= 0)
                    return BadRequest(new { message = "OwnerId is required." });

                var pet = new PetInsert
                {
                    Id = Guid.NewGuid(),
                    OwnerId = request.OwnerId,
                    Name = request.Name,
                    Type = request.Type,
                    Breed = request.Breed,
                    AgeMonths = request.AgeMonths,
                    Gender = request.Gender,
                    ImageUrl = request.ImageUrl,
                    IsAvailableForAdoption = request.IsAvailableForAdoption,
                    IsLookingForMatch = request.IsLookingForMatch
                };

                var adminClient = GetAdminClient();
                var result = await adminClient
                    .From<PetInsert>()
                    .Insert(pet);

                return Ok(new { id = pet.Id });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePetRequest request)
        {
            try
            {
                var update = new PetUpdate
                {
                    Id = id,
                    Name = request.Name,
                    Type = request.Type,
                    Breed = request.Breed,
                    AgeMonths = request.AgeMonths,
                    Gender = request.Gender,
                    ImageUrl = request.ImageUrl,
                    IsAvailableForAdoption = request.IsAvailableForAdoption,
                    IsLookingForMatch = request.IsLookingForMatch
                };

                var adminClient = GetAdminClient();
                await adminClient
                    .From<PetUpdate>()
                    .Update(update);

                return Ok(new { id });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try
            {
                var adminClient = GetAdminClient();
                await adminClient
                    .From<Pet>()
                    .Where(x => x.Id == id)
                    .Delete();

                return Ok(new { id });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        private static PetDto MapPet(Pet pet)
        {
            return new PetDto(
                pet.Id,
                pet.OwnerId,
                pet.Name,
                pet.Type,
                pet.Breed,
                pet.AgeMonths,
                pet.Gender,
                pet.ImageUrl,
                pet.IsAvailableForAdoption,
                pet.IsLookingForMatch,
                pet.CreatedAt,
                pet.UpdatedAt
            );
        }
    }

    public record CreatePetRequest(
        long? OwnerId,
        string Name,
        string? Type,
        string? Breed,
        int? AgeMonths,
        string? Gender,
        string? ImageUrl,
        bool? IsAvailableForAdoption,
        bool? IsLookingForMatch
    );

    public record UpdatePetRequest(
        string? Name,
        string? Type,
        string? Breed,
        int? AgeMonths,
        string? Gender,
        string? ImageUrl,
        bool? IsAvailableForAdoption,
        bool? IsLookingForMatch
    );

    public record PetDto(
        Guid Id,
        long? OwnerId,
        string Name,
        string? Type,
        string? Breed,
        int? AgeMonths,
        string? Gender,
        string? ImageUrl,
        bool? IsAvailableForAdoption,
        bool? IsLookingForMatch,
        DateTime? CreatedAt,
        DateTime? UpdatedAt
    );
}
