using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace petLifeApp.Models
{
    [Table("Veterinarians")]
    public class VeterinarianProfileRecord : BaseModel
    {
        [PrimaryKey("Id", false)]
        public Guid Id { get; set; }

        [Column("UserId")]
        public long UserId { get; set; }

        [Column("Specialization")]
        public string? Specialization { get; set; }

        [Column("ClinicName")]
        public string? ClinicName { get; set; }

<<<<<<< HEAD
=======
        [Column("ClinicAddress")]
        public string? ClinicAddress { get; set; }

>>>>>>> 566e763e4723dcdbb86bc931af1d7ad2ab712daf
        [Column("LicenseNumber")]
        public string? LicenseNumber { get; set; }

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

>>>>>>> 566e763e4723dcdbb86bc931af1d7ad2ab712daf
        [Column("CredentialsFileName")]
        public string? CredentialsFileName { get; set; }

        [Column("CredentialsContentType")]
        public string? CredentialsContentType { get; set; }

        [Column("IsVerified")]
        public bool? IsVerified { get; set; }

        [Column("IsOnline")]
        public bool? IsOnline { get; set; }

<<<<<<< HEAD
=======
        [Column("ClinicLocationUrl")]
        public string? ClinicLocationUrl { get; set; }

        [Column("AvailableHours")]
        public string? AvailableHours { get; set; }

>>>>>>> 566e763e4723dcdbb86bc931af1d7ad2ab712daf
        [Column("CreatedAt")]
        public DateTime? CreatedAt { get; set; }

        [Column("UpdatedAt")]
        public DateTime? UpdatedAt { get; set; }
    }
}
