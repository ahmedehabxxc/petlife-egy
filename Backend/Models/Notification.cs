using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace petLifeApp.Models
{
    [Table("Notifications")]
    public class Notification : BaseModel
    {
        [PrimaryKey("Id", false)]
        public Guid Id { get; set; }

        [Column("UserId")]
        public long? UserId { get; set; }

        [Column("SenderId")]
        public long? SenderId { get; set; }

        [Column("Title")]
        public string? Title { get; set; }

        [Column("Message")]
        public string? Message { get; set; }

        [Column("IsRead")]
        public bool? IsRead { get; set; }

        [Column("ActionUrl")]
        public string? ActionUrl { get; set; }

        [Column("Type")]
        public string? Type { get; set; }

        [Column("ConversationId")]
        public Guid? ConversationId { get; set; }

        [Column("RelatedId")]
        public Guid? RelatedId { get; set; }

        [Column("CreatedAt")]
        public DateTime? CreatedAt { get; set; }
    }
}
