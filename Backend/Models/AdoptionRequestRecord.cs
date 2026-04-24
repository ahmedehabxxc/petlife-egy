using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace petLifeApp.Models
{
    [Table("AdoptionRequests")]
    public class AdoptionRequestRecord : BaseModel
    {
        [PrimaryKey("Id", false)]
        public Guid Id { get; set; }

        [Column("SenderUserId")]
        public long SenderUserId { get; set; }

        [Column("ReceiverUserId")]
        public long ReceiverUserId { get; set; }

        [Column("PetId")]
        public Guid? PetId { get; set; }

        [Column("Status")]
        public string? Status { get; set; }

        [Column("CreatedAt")]
        public DateTime? CreatedAt { get; set; }

        [Column("UpdatedAt")]
        public DateTime? UpdatedAt { get; set; }
    }
}
