using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace petLifeApp.Models
{
    [Table("MedicalRecords")]
    public class MedicalRecordRecord : BaseModel
    {
        [PrimaryKey("Id", false)]
        public Guid Id { get; set; }

        [Column("PetId")]
        public Guid? PetId { get; set; }

        [Column("VetId")]
        public Guid? VetId { get; set; }

        [Column("RecordDate")]
        public DateTime? RecordDate { get; set; }

        [Column("Title")]
        public string? Diagnosis { get; set; }

        [Column("RecordType")]
        public string? RecordType { get; set; }

        [Column("ConsultationId")]
        public Guid? ConsultationId { get; set; }

        [Column("Treatment")]
        public string? Treatment { get; set; }

        [Column("Notes")]
        public string? Notes { get; set; }

        [Column("Prescription")]
        public string? Prescription { get; set; }

        [Column("ChatTranscript")]
        public string? ChatTranscript { get; set; }

        [Column("VaccineName")]
        public string? VaccineName { get; set; }

        [Column("NextDueDate")]
        public DateTime? NextDueDate { get; set; }

        [Column("AttachmentUrl")]
        public string? AttachmentUrl { get; set; }

        [Column("CreatedAt")]
        public DateTime? CreatedAt { get; set; }

        [Column("UpdatedAt")]
        public DateTime? UpdatedAt { get; set; }
    }
}
