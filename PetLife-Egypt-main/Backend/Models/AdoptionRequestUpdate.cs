using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace petLifeApp.Models
{
    [Table("AdoptionRequests")]
    public class AdoptionRequestUpdate : BaseModel
    {
        [PrimaryKey("Id", false)]
        public Guid Id { get; set; }

        [Column("Status")]
        public string? Status { get; set; }

        [Column("UpdatedAt")]
        public DateTime? UpdatedAt { get; set; }
    }
}
