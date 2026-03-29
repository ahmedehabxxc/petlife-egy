using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace petLifeApp.Models
{
    [Table("ConsultationRequests")]
    public class ConsultationRequestRecord : BaseModel
    {
        [PrimaryKey("Id", false)]
        public Guid Id { get; set; }

        [Column("PetOwnerId")]
        public long PetOwnerId { get; set; }

        [Column("VetId")]
        public Guid VetId { get; set; }

        [Column("PetId")]
        public Guid PetId { get; set; }

        [Column("Status")]
        public string? Status { get; set; }

        [Column("Fee")]
        public decimal? Fee { get; set; }

        [Column("StartedAt")]
        public DateTime? StartedAt { get; set; }

        [Column("EndedAt")]
        public DateTime? EndedAt { get; set; }

        [Column("CreatedAt")]
        public DateTime? CreatedAt { get; set; }

        [Column("UpdatedAt")]
        public DateTime? UpdatedAt { get; set; }
    }
}
