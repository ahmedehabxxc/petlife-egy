using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace petLifeApp.Models
{
    [Table("Veterinarians")]
    public class VeterinarianCredentialsUpdate : BaseModel
    {
        [PrimaryKey("Id", false)]
        public Guid Id { get; set; }

        [Column("CredentialsFile")]
        public byte[]? CredentialsFile { get; set; }

        [Column("CredentialsFileName")]
        public string? CredentialsFileName { get; set; }

        [Column("CredentialsContentType")]
        public string? CredentialsContentType { get; set; }
    }
}
