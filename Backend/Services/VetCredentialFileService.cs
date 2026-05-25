namespace petLifeApp.Services
{
    public class VetCredentialFileService
    {
        private readonly IWebHostEnvironment _env;

        public VetCredentialFileService(IWebHostEnvironment env)
        {
            _env = env;
        }

        private string GetVetDirectory(Guid vetId)
        {
            return Path.Combine(_env.WebRootPath, "uploads", "vet-credentials", vetId.ToString());
        }

        public async Task<string> SaveAsync(Guid vetId, byte[] bytes, string fileName)
        {
            var safeName = Path.GetFileName(fileName);
            if (string.IsNullOrWhiteSpace(safeName))
            {
                safeName = "credentials.bin";
            }

            var dir = GetVetDirectory(vetId);
            Directory.CreateDirectory(dir);

            foreach (var existing in Directory.GetFiles(dir))
            {
                try { File.Delete(existing); } catch { /* ignore */ }
            }

            var path = Path.Combine(dir, safeName);
            await File.WriteAllBytesAsync(path, bytes);
            return safeName;
        }

        public (byte[] Bytes, string ContentType, string FileName)? TryLoad(
            Guid vetId,
            string? fileName,
            string? contentType,
            byte[]? databaseBytes)
        {
            var dir = GetVetDirectory(vetId);
            if (!string.IsNullOrWhiteSpace(fileName))
            {
                var path = Path.Combine(dir, Path.GetFileName(fileName));
                if (File.Exists(path))
                {
                    return (
                        File.ReadAllBytes(path),
                        string.IsNullOrWhiteSpace(contentType) ? GuessContentType(fileName) : contentType,
                        Path.GetFileName(fileName)!
                    );
                }
            }

            if (Directory.Exists(dir))
            {
                var anyFile = Directory.GetFiles(dir).FirstOrDefault();
                if (anyFile != null)
                {
                    var name = Path.GetFileName(anyFile);
                    return (
                        File.ReadAllBytes(anyFile),
                        string.IsNullOrWhiteSpace(contentType) ? GuessContentType(name) : contentType,
                        name
                    );
                }
            }

            if (databaseBytes != null && databaseBytes.Length > 0)
            {
                var normalized = SupabaseCredentialStore.NormalizeCredentialBytes(databaseBytes, _env);
                if (normalized != null && normalized.Length > 0)
                {
                    return (
                        normalized,
                        string.IsNullOrWhiteSpace(contentType) ? GuessContentType(fileName ?? "file") : contentType,
                        string.IsNullOrWhiteSpace(fileName) ? "credentials" : fileName
                    );
                }
            }

            return null;
        }

        private static string GuessContentType(string fileName)
        {
            var ext = Path.GetExtension(fileName).ToLowerInvariant();
            return ext switch
            {
                ".pdf" => "application/pdf",
                ".png" => "image/png",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".webp" => "image/webp",
                _ => "application/octet-stream"
            };
        }
    }
}
