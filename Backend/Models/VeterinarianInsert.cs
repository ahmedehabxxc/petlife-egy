using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace petLifeApp.Models
{
    [Table("Veterinarians")]
    public class VeterinarianInsert : BaseModel
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

        [Column("IsVerified")]
        public bool? IsVerified { get; set; }
    }
}
