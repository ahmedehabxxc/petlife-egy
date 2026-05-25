using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace petLifeApp.Models
{
    [Table("MatchRequests")]
    public class MatchRequestInsert : BaseModel
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
    }
}
