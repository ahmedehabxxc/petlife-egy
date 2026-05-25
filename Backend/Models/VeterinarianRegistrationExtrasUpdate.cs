using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace petLifeApp.Models
{
    /// <summary>Only columns present on base Veterinarians schema — avoids failed updates for optional profile columns.</summary>
    [Table("Veterinarians")]
    public class VeterinarianRegistrationExtrasUpdate : BaseModel
    {
        [PrimaryKey("Id", false)]
        public Guid Id { get; set; }

        [Column("University")]
        public string? University { get; set; }

        [Column("YearsOfExperience")]
        public int? YearsOfExperience { get; set; }

        [Column("Bio")]
        public string? Bio { get; set; }

        [Column("UpdatedAt")]
        public DateTime? UpdatedAt { get; set; }
    }
}
