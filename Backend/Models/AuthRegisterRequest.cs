using System.Text.Json.Serialization;

namespace petLifeApp.Models
{
    /// <summary>
    /// Vet/pet-owner registration body. Explicit JSON names so camelCase from the frontend always binds.
    /// </summary>
    public class AuthRegisterRequest
    {
        public string Email { get; set; } = "";

        public string Password { get; set; } = "";

        [JsonPropertyName("firstName")]
        public string? FirstName { get; set; }

        [JsonPropertyName("lastName")]
        public string? LastName { get; set; }

        public string? Phone { get; set; }

        public string? Role { get; set; }

        [JsonPropertyName("licenseNumber")]
        public string? LicenseNumber { get; set; }

        public string? Specialization { get; set; }

        [JsonPropertyName("clinicName")]
        public string? ClinicName { get; set; }

        public string? University { get; set; }

        [JsonPropertyName("yearsOfExperience")]
        public int? YearsOfExperience { get; set; }

        public string? Bio { get; set; }

        [JsonPropertyName("consultationFee")]
        public decimal? ConsultationFee { get; set; }

        [JsonPropertyName("clinicAddress")]
        public string? ClinicAddress { get; set; }

        [JsonPropertyName("availableHours")]
        public string? AvailableHours { get; set; }

        [JsonPropertyName("credentialFileBase64")]
        public string? CredentialFileBase64 { get; set; }

        [JsonPropertyName("credentialFileName")]
        public string? CredentialFileName { get; set; }

        [JsonPropertyName("credentialContentType")]
        public string? CredentialContentType { get; set; }

        [JsonPropertyName("profilePhotoBase64")]
        public string? ProfilePhotoBase64 { get; set; }

        [JsonPropertyName("profilePhotoFileName")]
        public string? ProfilePhotoFileName { get; set; }

        [JsonPropertyName("profilePhotoContentType")]
        public string? ProfilePhotoContentType { get; set; }
    }

    public class AuthLoginRequest
    {
        public string Email { get; set; } = "";
        public string Password { get; set; } = "";
    }
}
