using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace petLifeApp.Models
{
    [Table("Veterinarians")]
    public class VeterinarianExtrasUpdate : BaseModel
    {
        [PrimaryKey("Id", false)]
        public Guid Id { get; set; }

<<<<<<< HEAD
=======
        [Column("ClinicAddress")]
        public string? ClinicAddress { get; set; }

>>>>>>> 566e763e4723dcdbb86bc931af1d7ad2ab712daf
        [Column("University")]
        public string? University { get; set; }

        [Column("YearsOfExperience")]
        public int? YearsOfExperience { get; set; }

        [Column("Bio")]
        public string? Bio { get; set; }

<<<<<<< HEAD
=======
        [Column("ConsultationFee")]
        public decimal? ConsultationFee { get; set; }

        [Column("AvatarUrl")]
        public string? AvatarUrl { get; set; }

        [Column("AvailableHours")]
        public string? AvailableHours { get; set; }

>>>>>>> 566e763e4723dcdbb86bc931af1d7ad2ab712daf
        [Column("IsOnline")]
        public bool? IsOnline { get; set; }

        [Column("UpdatedAt")]
        public DateTime? UpdatedAt { get; set; }
    }
}
