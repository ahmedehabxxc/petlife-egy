using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace petLifeApp.Models
{
    [Table("Veterinarians")]
    public class VeterinarianAdminReviewRecord : BaseModel
    {
        [PrimaryKey("Id", false)]
        public Guid Id { get; set; }

        [Column("UserId")]
        public long UserId { get; set; }

        [Column("Specialization")]
        public string? Specialization { get; set; }

        [Column("ClinicName")]
        public string? ClinicName { get; set; }

        [Column("LicenseNumber")]
        public string? LicenseNumber { get; set; }

        [Column("University")]
        public string? University { get; set; }

        [Column("YearsOfExperience")]
        public int? YearsOfExperience { get; set; }

        [Column("Bio")]
        public string? Bio { get; set; }

        [Column("CredentialsFile")]
        public string? CredentialsFile { get; set; }

        [Column("CredentialsFileName")]
        public string? CredentialsFileName { get; set; }

        [Column("CredentialsContentType")]
        public string? CredentialsContentType { get; set; }

        [Column("IsVerified")]
        public bool? IsVerified { get; set; }

        [Column("IsOnline")]
        public bool? IsOnline { get; set; }

        [Column("CreatedAt")]
        public DateTime? CreatedAt { get; set; }

        [Column("UpdatedAt")]
        public DateTime? UpdatedAt { get; set; }
    }
}
