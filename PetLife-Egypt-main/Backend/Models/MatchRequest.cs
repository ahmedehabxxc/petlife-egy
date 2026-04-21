using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace petLifeApp.Models
{
    [Table("MatchRequests")]
    public class MatchRequest : BaseModel
    {
        [PrimaryKey("Id", false)]
        public Guid Id { get; set; }

        [Column("SenderUserId")]
        public long SenderUserId { get; set; }

        [Column("ReceiverUserId")]
        public long ReceiverUserId { get; set; }

        [Column("PetId")]
        public Guid PetId { get; set; }

        [Column("Status")]
        public string Status { get; set; } = "pending";

        [Column("CreatedAt")]
        public DateTime? CreatedAt { get; set; }

        [Column("UpdatedAt")]
        public DateTime? UpdatedAt { get; set; }
    }
}
