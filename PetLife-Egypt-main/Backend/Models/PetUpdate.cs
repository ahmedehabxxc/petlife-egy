using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace petLifeApp.Models
{
    [Table("Pets")]
    public class PetUpdate : BaseModel
    {
        [PrimaryKey("Id", false)]
        public Guid Id { get; set; }

        [Column("Name")]
        public string? Name { get; set; }

        [Column("Type")]
        public string? Type { get; set; }

        [Column("Breed")]
        public string? Breed { get; set; }

        [Column("AgeMonths")]
        public int? AgeMonths { get; set; }

        [Column("Gender")]
        public string? Gender { get; set; }

        [Column("ImageUrl")]
        public string? ImageUrl { get; set; }

        [Column("IsAvailableForAdoption")]
        public bool? IsAvailableForAdoption { get; set; }

        [Column("IsLookingForMatch")]
        public bool? IsLookingForMatch { get; set; }
    }
}
