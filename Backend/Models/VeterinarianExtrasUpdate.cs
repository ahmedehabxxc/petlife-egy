using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace petLifeApp.Models
{
    [Table("Veterinarians")]
    public class VeterinarianExtrasUpdate : BaseModel
    {
        [PrimaryKey("Id", false)]
        public Guid Id { get; set; }

        [Column("ClinicAddress")]
        public string? ClinicAddress { get; set; }

        [Column("University")]
        public string? University { get; set; }

        [Column("YearsOfExperience")]
        public int? YearsOfExperience { get; set; }

        [Column("Bio")]
        public string? Bio { get; set; }

        [Column("ConsultationFee")]
        public decimal? ConsultationFee { get; set; }

        [Column("AvatarUrl")]
        public string? AvatarUrl { get; set; }

        [Column("AvailableHours")]
        public string? AvailableHours { get; set; }

        [Column("IsOnline")]
        public bool? IsOnline { get; set; }

        [Column("UpdatedAt")]
        public DateTime? UpdatedAt { get; set; }
    }
}
